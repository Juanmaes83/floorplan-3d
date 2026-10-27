/* Budget Core (Point 7B): non-UI, EUR-first budget math and auditability.
   Geometry is never measured here. Quantity inputs must come from Point 7A or an explicit manual source. */
(function(root){
  'use strict';

  const SCHEMA = 'rubik-sota.floorplan-budget';
  const VERSION = '1.0.0';
  const CURRENCY = 'EUR';
  const UNITS = Object.freeze(['m2', 'm', 'unit']);
  const QUANTITY_STATUSES = Object.freeze(['measured', 'estimated', 'unavailable']);
  const REVIEW_STATUSES = Object.freeze(['unreviewed', 'reviewed']);

  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const finite = Number.isFinite;
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const fail = message => { throw new TypeError(`FloorPlanBudget: ${message}`); };
  const requireString = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a non-empty string`);
    return value.trim();
  };
  const calendarDateValid = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (month < 1 || month > 12) return false;
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return day >= 1 && day <= days;
  };
  const validateDate = (value, label) => {
    if (value === null || value === undefined) return null;
    if (!calendarDateValid(value)) fail(`${label} must be YYYY-MM-DD or null`);
    return value;
  };
  const validateDateTime = (value, label) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string' || !calendarDateValid(value.slice(0,10)) || !/^\d{4}-\d\d-\d\d[Tt]\d\d:\d\d:\d\d(?:\.\d+)?(?:[Zz]|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) fail(`${label} must be an offset-aware ISO date-time or null`);
    return value;
  };
  const validatePercent = (value, label, {nullable=false}={}) => {
    if (value === null && nullable) return null;
    if (!finite(value) || value < 0 || value > 100) fail(`${label} must be between 0 and 100${nullable ? ' or null' : ''}`);
    return value;
  };
  const validateMoney = (value, label, {nullable=false}={}) => {
    if (value === null && nullable) return null;
    if (!finite(value) || value < 0) fail(`${label} must be a finite non-negative number${nullable ? ' or null' : ''}`);
    return value;
  };
  const roundMoney = value => value === null ? null : Math.round((value + Number.EPSILON) * 100) / 100;
  const sumMoney = values => {
    if (!values.length) return null;
    const cents = values.reduce((sum, value) => sum + Math.round((value + Number.EPSILON) * 100), 0);
    return cents / 100;
  };

  function createBudget({id, subject, title='Presupuesto', taxRatePercent=null}={}) {
    const cleanId = requireString(id, 'budget id');
    if (!subject || typeof subject !== 'object') fail('subject is required');
    if (!['project', 'building'].includes(subject.type)) fail('subject.type must be project or building');
    const subjectId = requireString(subject.id, 'subject.id');
    return {
      schema: SCHEMA,
      schemaVersion: VERSION,
      id: cleanId,
      subject: {type: subject.type, id: subjectId},
      title: requireString(title, 'title'),
      currency: CURRENCY,
      taxRatePercent: validatePercent(taxRatePercent, 'taxRatePercent', {nullable:true}),
      chapters: [],
      items: []
    };
  }

  function createChapter({id, title, order=0}={}) {
    if (!Number.isSafeInteger(order)) fail('chapter order must be an integer');
    return {id: requireString(id, 'chapter id'), title: requireString(title, 'chapter title'), order};
  }

  function quantityFrom7A({value, unit, status, complete=true, ref}={}) {
    if (!UNITS.includes(unit)) fail(`unsupported quantity unit ${unit}`);
    if (!QUANTITY_STATUSES.includes(status)) fail('quantity status must be measured, estimated or unavailable');
    if (typeof complete !== 'boolean') fail('quantity complete must be boolean');
    if (status === 'unavailable') {
      if (value !== null) fail('unavailable quantity must have value null');
      if (complete) fail('unavailable quantity cannot be complete');
    } else if (!finite(value) || value < 0) fail('available quantity must be a finite non-negative number');
    if (!ref || typeof ref !== 'object') fail('7A quantity ref is required');
    return {
      value,
      unit,
      status,
      complete,
      source: {
        type: 'quantity-engine',
        engine: 'FloorPlanQuantities',
        ref: clone(ref)
      }
    };
  }

  function manualQuantity({value, unit, status='estimated', complete=true, label='Manual'}={}) {
    if (!UNITS.includes(unit)) fail(`unsupported quantity unit ${unit}`);
    if (!['measured', 'estimated'].includes(status)) fail('manual quantity status must be measured or estimated');
    if (!finite(value) || value < 0) fail('manual quantity must be a finite non-negative number');
    if (typeof complete !== 'boolean') fail('quantity complete must be boolean');
    return {value, unit, status, complete, source:{type:'manual', label:requireString(label, 'manual quantity label')}};
  }

  function manualPrice({unitPrice, label='Manual', asOf=null}={}) {
    return {
      unitPrice: validateMoney(unitPrice, 'unitPrice'),
      priceSource: {type:'manual', label:requireString(label, 'manual price label'), asOf:validateDate(asOf, 'priceSource.asOf')},
      review: {status:'unreviewed', reviewedAt:null}
    };
  }

  function createItem({id, chapterId=null, description, quantity, wastePercent=0, unitPrice=null, priceSource=null, taxRatePercent, review}={}) {
    if (!quantity || typeof quantity !== 'object') fail('item quantity is required');
    const q = validateQuantity(quantity);
    const item = {
      id: requireString(id, 'item id'),
      chapterId: chapterId === null ? null : requireString(chapterId, 'chapterId'),
      description: requireString(description, 'description'),
      quantity: q,
      wastePercent: validatePercent(wastePercent, 'wastePercent'),
      unitPrice: validateMoney(unitPrice, 'unitPrice', {nullable:true}),
      priceSource: priceSource === null ? null : validatePriceSource(priceSource),
      review: validateReview(review ?? {status:'unreviewed', reviewedAt:null})
    };
    if (taxRatePercent !== undefined) item.taxRatePercent = validatePercent(taxRatePercent, 'item.taxRatePercent');
    validatePriceAndReview(item);
    return item;
  }

  function setManualPrice(item, {unitPrice, label='Manual', asOf=null}={}) {
    const next = clone(validateItem(item));
    const manual = manualPrice({unitPrice, label, asOf});
    next.unitPrice = manual.unitPrice;
    next.priceSource = manual.priceSource;
    next.review = manual.review;
    return next;
  }

  function clearPrice(item) {
    const next = clone(validateItem(item));
    next.unitPrice = null;
    next.priceSource = null;
    next.review = {status:'unreviewed', reviewedAt:null};
    return next;
  }

  function markReviewed(item, {reviewedAt, note}={}) {
    const next = clone(validateItem(item));
    if (next.unitPrice === null) fail('cannot review an item without a unit price');
    const cleanAt = validateDateTime(reviewedAt, 'reviewedAt');
    if (!cleanAt) fail('reviewedAt is required');
    next.review = {status:'reviewed', reviewedAt:cleanAt};
    if (note !== undefined) next.review.note = requireString(note, 'review note');
    return next;
  }

  function validateQuantity(quantity) {
    if (!quantity || typeof quantity !== 'object') fail('quantity must be an object');
    if (!UNITS.includes(quantity.unit)) fail(`unsupported quantity unit ${quantity.unit}`);
    if (!QUANTITY_STATUSES.includes(quantity.status)) fail('quantity status must be measured, estimated or unavailable');
    if (typeof quantity.complete !== 'boolean') fail('quantity complete must be boolean');
    if (quantity.status === 'unavailable') {
      if (quantity.value !== null) fail('unavailable quantity must have value null');
      if (quantity.complete) fail('unavailable quantity cannot be complete');
    } else if (!finite(quantity.value) || quantity.value < 0) fail('available quantity must be a finite non-negative number');
    if (!quantity.source || typeof quantity.source !== 'object') fail('quantity source is required');
    if (quantity.source.type === 'quantity-engine') {
      if (quantity.source.engine !== 'FloorPlanQuantities') fail('quantity-engine source must be FloorPlanQuantities');
      if (!quantity.source.ref || typeof quantity.source.ref !== 'object') fail('quantity-engine ref is required');
    } else if (quantity.source.type === 'manual') {
      requireString(quantity.source.label, 'manual quantity source label');
    } else fail('quantity source type must be quantity-engine or manual');
    return clone(quantity);
  }

  function validatePriceSource(source) {
    if (!source || typeof source !== 'object') fail('priceSource must be an object');
    if (source.type !== 'manual') fail('7B only supports manual priceSource');
    return {type:'manual', label:requireString(source.label, 'priceSource.label'), asOf:validateDate(source.asOf ?? null, 'priceSource.asOf')};
  }

  function validateReview(review) {
    if (!review || typeof review !== 'object' || !REVIEW_STATUSES.includes(review.status)) fail('review.status must be unreviewed or reviewed');
    const result = {status:review.status, reviewedAt:validateDateTime(review.reviewedAt ?? null, 'review.reviewedAt')};
    if (review.status === 'reviewed' && !result.reviewedAt) fail('reviewed item requires reviewedAt');
    if (review.status === 'unreviewed' && result.reviewedAt !== null) fail('unreviewed item cannot have reviewedAt');
    if (review.note !== undefined) result.note = requireString(review.note, 'review.note');
    return result;
  }

  function validatePriceAndReview(item) {
    if (item.unitPrice === null) {
      if (item.priceSource !== null) fail('item without unitPrice cannot have priceSource');
      if (item.review.status === 'reviewed') fail('item without unitPrice cannot be reviewed');
    } else if (item.priceSource === null) fail('priced item requires priceSource');
  }

  function validateItem(item) {
    if (!item || typeof item !== 'object') fail('item must be an object');
    const normalized = createItem({
      id:item.id,
      chapterId:item.chapterId ?? null,
      description:item.description,
      quantity:item.quantity,
      wastePercent:item.wastePercent,
      unitPrice:item.unitPrice,
      priceSource:item.priceSource ?? null,
      ...(hasOwn(item, 'taxRatePercent') ? {taxRatePercent:item.taxRatePercent} : {}),
      review:item.review
    });
    return normalized;
  }

  function validateBudget(budget) {
    if (!budget || typeof budget !== 'object') fail('budget must be an object');
    if (budget.schema !== SCHEMA) fail(`schema must be ${SCHEMA}`);
    if (budget.schemaVersion !== VERSION) fail(`schemaVersion must be ${VERSION}`);
    const id = requireString(budget.id, 'budget id');
    if (!budget.subject || !['project','building'].includes(budget.subject.type)) fail('budget subject.type must be project or building');
    const subject = {type:budget.subject.type, id:requireString(budget.subject.id, 'budget subject.id')};
    const title = requireString(budget.title, 'budget title');
    if (budget.currency !== CURRENCY) fail('7B currency must be EUR');
    const taxRatePercent = validatePercent(budget.taxRatePercent, 'budget.taxRatePercent', {nullable:true});
    if (!Array.isArray(budget.chapters) || !Array.isArray(budget.items)) fail('chapters and items must be arrays');
    const chapters = budget.chapters.map(createChapter), chapterIds = new Set();
    for (const chapter of chapters) {
      if (chapterIds.has(chapter.id)) fail(`duplicate chapter id ${chapter.id}`);
      chapterIds.add(chapter.id);
    }
    const items = budget.items.map(validateItem), itemIds = new Set();
    for (const item of items) {
      if (itemIds.has(item.id)) fail(`duplicate item id ${item.id}`);
      itemIds.add(item.id);
      if (item.chapterId !== null && !chapterIds.has(item.chapterId)) fail(`unknown chapter ${item.chapterId}`);
    }
    return {schema:SCHEMA, schemaVersion:VERSION, id, subject, title, currency:CURRENCY, taxRatePercent, chapters, items};
  }

  function serializeBudget(budget) {
    return JSON.stringify(validateBudget(budget));
  }

  function parseBudget(text) {
    if (typeof text !== 'string') fail('serialized budget must be a string');
    let parsed;
    try { parsed = JSON.parse(text); } catch { fail('invalid budget JSON'); }
    return validateBudget(parsed);
  }

  function calculateItem(item, budgetTaxRatePercent=null) {
    const clean = validateItem(item);
    validatePercent(budgetTaxRatePercent, 'budget taxRatePercent', {nullable:true});
    const quantityValue = clean.quantity.value;
    const budgetQuantity = quantityValue === null ? null : quantityValue * (1 + clean.wastePercent / 100);
    const subtotalNet = budgetQuantity === null || clean.unitPrice === null ? null : roundMoney(budgetQuantity * clean.unitPrice);
    const effectiveTaxRatePercent = hasOwn(clean, 'taxRatePercent') ? clean.taxRatePercent : budgetTaxRatePercent;
    const taxAmount = subtotalNet === null || effectiveTaxRatePercent === null ? null : roundMoney(subtotalNet * effectiveTaxRatePercent / 100);
    const subtotalGross = subtotalNet === null || taxAmount === null ? null : roundMoney(subtotalNet + taxAmount);
    return {
      ...clone(clean),
      budgetQuantity,
      effectiveTaxRatePercent,
      subtotalNet,
      taxAmount,
      subtotalGross,
      pricingComplete: subtotalNet !== null,
      taxComplete: subtotalGross !== null
    };
  }

  function summarizeLines(lines) {
    const netKnown = lines.filter(line => line.subtotalNet !== null);
    const taxKnown = lines.filter(line => line.taxAmount !== null);
    const grossKnown = lines.filter(line => line.subtotalGross !== null);
    const unpricedItemIds = lines.filter(line => line.unitPrice === null).map(line => line.id);
    const unavailableQuantityItemIds = lines.filter(line => line.quantity.value === null).map(line => line.id);
    const incompleteQuantityItemIds = lines.filter(line => !line.quantity.complete).map(line => line.id);
    const unreviewedPriceItemIds = lines.filter(line => line.unitPrice !== null && line.review.status !== 'reviewed').map(line => line.id);
    return {
      net:{amount:sumMoney(netKnown.map(line => line.subtotalNet)), complete:netKnown.length === lines.length, missingItemIds:lines.filter(line => line.subtotalNet === null).map(line => line.id)},
      tax:{amount:sumMoney(taxKnown.map(line => line.taxAmount)), complete:taxKnown.length === lines.length, missingItemIds:lines.filter(line => line.taxAmount === null).map(line => line.id)},
      gross:{amount:sumMoney(grossKnown.map(line => line.subtotalGross)), complete:grossKnown.length === lines.length, missingItemIds:lines.filter(line => line.subtotalGross === null).map(line => line.id)},
      unpricedItemIds,
      unavailableQuantityItemIds,
      incompleteQuantityItemIds,
      unreviewedPriceItemIds,
      reviewComplete: unpricedItemIds.length === 0 && unreviewedPriceItemIds.length === 0
    };
  }

  function calculateBudget(budget) {
    const clean = validateBudget(budget);
    const lines = clean.items.map(item => calculateItem(item, clean.taxRatePercent));
    const chapterMap = new Map(clean.chapters.map(chapter => [chapter.id, {...clone(chapter), itemIds:[]} ]));
    const unassigned = [];
    for (const line of lines) {
      if (line.chapterId === null) unassigned.push(line.id);
      else chapterMap.get(line.chapterId).itemIds.push(line.id);
    }
    const lineMap = new Map(lines.map(line => [line.id, line]));
    const chapters = [...chapterMap.values()]
      .sort((a,b) => a.order - b.order || a.title.localeCompare(b.title))
      .map(chapter => ({...chapter, totals:summarizeLines(chapter.itemIds.map(id => lineMap.get(id)))}));
    return {
      schema: clean.schema,
      schemaVersion: clean.schemaVersion,
      budgetId: clean.id,
      subject: clone(clean.subject),
      title: clean.title,
      currency: clean.currency,
      taxRatePercent: clean.taxRatePercent,
      lines,
      chapters,
      unassigned:{itemIds:unassigned, totals:summarizeLines(unassigned.map(id => lineMap.get(id)))},
      totals:summarizeLines(lines)
    };
  }

  const api = {
    SCHEMA, VERSION, CURRENCY, UNITS, QUANTITY_STATUSES, REVIEW_STATUSES,
    createBudget, createChapter, quantityFrom7A, manualQuantity, manualPrice,
    createItem, setManualPrice, clearPrice, markReviewed,
    validateBudget, validateItem, serializeBudget, parseBudget, calculateItem, calculateBudget, roundMoney
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FloorPlanBudget = api;
})(globalThis);
