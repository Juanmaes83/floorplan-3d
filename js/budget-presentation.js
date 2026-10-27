/* Budget Presentation / Export (Point 7D).
   Presentation is derived only from FloorPlanBudget.calculateBudget(); this module never remeasures geometry
   and never recomputes waste, line subtotals or VAT from raw budget inputs. */
(function(root, factory){
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./budget-core.js'));
  else root.FloorPlanBudgetPresentation = factory(root.FloorPlanBudget);
})(globalThis, function(Budget){
  'use strict';

  const VERSION = '1.0.0';
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const fail = message => { throw new TypeError(`FloorPlanBudgetPresentation: ${message}`); };

  if (!Budget || typeof Budget.calculateBudget !== 'function') fail('FloorPlanBudget.calculateBudget is required');

  const sumCalculatedMoney = values => {
    if (!values.length) return null;
    const cents = values.reduce((sum, value) => sum + Math.round((value + Number.EPSILON) * 100), 0);
    return cents / 100;
  };

  function summarizeCalculatedLines(lines){
    const netKnown = lines.filter(line => line.subtotalNet !== null);
    const taxKnown = lines.filter(line => line.taxAmount !== null);
    const grossKnown = lines.filter(line => line.subtotalGross !== null);
    const unpricedItemIds = lines.filter(line => line.unitPrice === null).map(line => line.id);
    const unavailableQuantityItemIds = lines.filter(line => line.quantity?.value === null).map(line => line.id);
    const incompleteQuantityItemIds = lines.filter(line => line.quantity?.complete === false).map(line => line.id);
    const unreviewedPriceItemIds = lines.filter(line => line.unitPrice !== null && line.review?.status !== 'reviewed').map(line => line.id);
    return {
      net:{amount:sumCalculatedMoney(netKnown.map(line => line.subtotalNet)),complete:netKnown.length === lines.length,missingItemIds:lines.filter(line => line.subtotalNet === null).map(line => line.id)},
      tax:{amount:sumCalculatedMoney(taxKnown.map(line => line.taxAmount)),complete:taxKnown.length === lines.length,missingItemIds:lines.filter(line => line.taxAmount === null).map(line => line.id)},
      gross:{amount:sumCalculatedMoney(grossKnown.map(line => line.subtotalGross)),complete:grossKnown.length === lines.length,missingItemIds:lines.filter(line => line.subtotalGross === null).map(line => line.id)},
      unpricedItemIds,
      unavailableQuantityItemIds,
      incompleteQuantityItemIds,
      unreviewedPriceItemIds,
      reviewComplete:unpricedItemIds.length === 0 && unreviewedPriceItemIds.length === 0
    };
  }

  function contextForLine(line, subject){
    const source = line?.quantity?.source;
    if (source?.type !== 'quantity-engine' || !source.ref || typeof source.ref !== 'object') return null;
    const scope = typeof source.ref.scope === 'string' ? source.ref.scope.trim() : '';
    if (!['room','level','home'].includes(scope)) return null;
    let id = typeof source.ref.id === 'string' && source.ref.id.trim() ? source.ref.id.trim() : null;
    if (scope === 'home' && id === null && subject?.id) id = subject.id;
    if (id === null) return null;
    return {scope,id};
  }

  function buildContexts(lines, subject){
    const groups = new Map();
    const unscopedItemIds = [];
    for (const line of lines){
      const context = contextForLine(line, subject);
      if (!context){
        unscopedItemIds.push(line.id);
        continue;
      }
      const key = `${context.scope}:${context.id}`;
      if (!groups.has(key)) groups.set(key,{key,scope:context.scope,id:context.id,itemIds:[],lines:[]});
      const group = groups.get(key);
      group.itemIds.push(line.id);
      group.lines.push(line);
    }
    const contexts = [...groups.values()].map(group => ({
      key:group.key,
      scope:group.scope,
      id:group.id,
      itemIds:group.itemIds,
      totals:summarizeCalculatedLines(group.lines)
    }));
    contexts.sort((a,b) => a.scope.localeCompare(b.scope) || a.id.localeCompare(b.id));
    return {contexts,unscopedItemIds};
  }

  function buildWarnings(calculation){
    const warnings = [];
    const totals = calculation.totals;
    if (totals.unpricedItemIds.length) warnings.push({code:'unpriced-items',itemIds:clone(totals.unpricedItemIds)});
    if (totals.unavailableQuantityItemIds.length) warnings.push({code:'unavailable-quantities',itemIds:clone(totals.unavailableQuantityItemIds)});
    if (totals.incompleteQuantityItemIds.length) warnings.push({code:'incomplete-quantities',itemIds:clone(totals.incompleteQuantityItemIds)});
    if (totals.unreviewedPriceItemIds.length) warnings.push({code:'unreviewed-prices',itemIds:clone(totals.unreviewedPriceItemIds)});
    if (!totals.tax.complete) warnings.push({code:'tax-incomplete',itemIds:clone(totals.tax.missingItemIds)});
    return warnings;
  }

  function buildReport(budget){
    const calculation = Budget.calculateBudget(budget);
    const lineMap = new Map(calculation.lines.map(line => [line.id,line]));
    const chapters = calculation.chapters.map(chapter => ({
      id:chapter.id,
      title:chapter.title,
      order:chapter.order,
      itemIds:clone(chapter.itemIds),
      lines:chapter.itemIds.map(id => clone(lineMap.get(id))),
      totals:clone(chapter.totals)
    }));
    const unassigned = {
      itemIds:clone(calculation.unassigned.itemIds),
      lines:calculation.unassigned.itemIds.map(id => clone(lineMap.get(id))),
      totals:clone(calculation.unassigned.totals)
    };
    const contextData = buildContexts(calculation.lines, calculation.subject);
    return {
      reportVersion:VERSION,
      budgetId:calculation.budgetId,
      subject:clone(calculation.subject),
      title:calculation.title,
      currency:calculation.currency,
      taxRatePercent:calculation.taxRatePercent,
      lines:clone(calculation.lines),
      chapters,
      unassigned,
      contexts:contextData.contexts,
      unscopedItemIds:contextData.unscopedItemIds,
      totals:clone(calculation.totals),
      warnings:buildWarnings(calculation)
    };
  }

  const csvColumns = Object.freeze([
    ['budget_id',(report,line)=>report.budgetId],
    ['subject_type',report=>report.subject.type],
    ['subject_id',report=>report.subject.id],
    ['chapter_id',(_report,line)=>line.chapterId],
    ['item_id',(_report,line)=>line.id],
    ['description',(_report,line)=>line.description],
    ['context_scope',(report,line)=>contextForLine(line,report.subject)?.scope ?? null],
    ['context_id',(report,line)=>contextForLine(line,report.subject)?.id ?? null],
    ['quantity_value',(_report,line)=>line.quantity.value],
    ['quantity_unit',(_report,line)=>line.quantity.unit],
    ['quantity_status',(_report,line)=>line.quantity.status],
    ['quantity_complete',(_report,line)=>line.quantity.complete],
    ['waste_percent',(_report,line)=>line.wastePercent],
    ['budget_quantity',(_report,line)=>line.budgetQuantity],
    ['unit_price_eur',(_report,line)=>line.unitPrice],
    ['price_source_type',(_report,line)=>line.priceSource?.type ?? null],
    ['price_source_label',(_report,line)=>line.priceSource?.label ?? line.priceReference?.source?.label ?? null],
    ['price_source_as_of',(_report,line)=>line.priceSource?.asOf ?? line.priceReference?.source?.asOf ?? null],
    ['price_provider_id',(_report,line)=>line.priceSource?.providerId ?? null],
    ['price_provider_item_id',(_report,line)=>line.priceSource?.itemId ?? null],
    ['reference_provider_id',(_report,line)=>line.priceReference?.providerId ?? null],
    ['reference_item_id',(_report,line)=>line.priceReference?.itemId ?? null],
    ['reference_license_status',(_report,line)=>line.priceReference?.source?.licenseStatus ?? null],
    ['review_status',(_report,line)=>line.review?.status ?? null],
    ['reviewed_at',(_report,line)=>line.review?.reviewedAt ?? null],
    ['tax_rate_percent',(_report,line)=>line.effectiveTaxRatePercent],
    ['subtotal_net_eur',(_report,line)=>line.subtotalNet],
    ['tax_eur',(_report,line)=>line.taxAmount],
    ['subtotal_gross_eur',(_report,line)=>line.subtotalGross],
    ['pricing_complete',(_report,line)=>line.pricingComplete],
    ['tax_complete',(_report,line)=>line.taxComplete]
  ]);

  function csvCell(value, delimiter){
    if (value === null || value === undefined) return '';
    const text = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    return /["\r\n]/.test(text) || text.includes(delimiter) ? `"${text.replace(/"/g,'""')}"` : text;
  }

  function toCsv(budget,{delimiter=',',newline='\r\n',bom=false}={}){
    if (![',',';','\t'].includes(delimiter)) fail('delimiter must be comma, semicolon or tab');
    if (!['\n','\r\n'].includes(newline)) fail('newline must be LF or CRLF');
    if (typeof bom !== 'boolean') fail('bom must be boolean');
    const report = buildReport(budget);
    const rows = [csvColumns.map(([name]) => csvCell(name,delimiter)).join(delimiter)];
    for (const line of report.lines){
      rows.push(csvColumns.map(([,getter]) => csvCell(getter(report,line),delimiter)).join(delimiter));
    }
    return `${bom ? '\uFEFF' : ''}${rows.join(newline)}${newline}`;
  }

  function serializeReport(budget){
    return JSON.stringify(buildReport(budget));
  }

  const api = {VERSION,buildReport,toCsv,serializeReport};
  return Object.freeze(api);
});
