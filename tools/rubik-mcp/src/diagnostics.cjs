'use strict';

const Spatial = require('./spatial.cjs');

const MAX_FINDINGS = 100;
const idType = path => {
  const parts = path.split('/').filter(Boolean);
  const kind = ['rooms', 'walls', 'openings', 'objects', 'materials', 'measurements', 'sourceImages'].includes(parts[0]) ? parts[0] : undefined;
  return { ...(kind ? { elementType: kind } : {}), ...(kind && parts[1] && !/^\d+$/.test(parts[1]) ? { elementId: parts[1] } : {}) };
};

async function diagnose(reader) {
  const inspected = await reader.inspect();
  const { snapshot, project, issue } = inspected;
  if (issue) return {
    snapshot, status: 'blocked', valid: false,
    findings: [{ severity: 'error', category: issue.category, rule: issue.rule,
      path: issue.path, ...idType(issue.path), evidence: issue.message }],
    checks: { contract: 'failed_first_error', references: 'not_exhaustive', geometry: 'not_run', spatialRelations: 'not_run' },
    note: 'El validador canónico informa el primer error; corrígelo y repite el diagnóstico. Las otras herramientas rechazan este JSON.',
  };

  const findings = [];
  let totalFindings = 0;
  const add = finding => { totalFindings++; if (findings.length < MAX_FINDINGS) findings.push(finding); };
  if (project.scale.confidence !== 'real') add({ severity: 'info', category: 'scale', elementType: 'project', elementId: project.id,
    rule: 'scale.confidence', evidence: { confidence: project.scale.confidence, method: project.scale.method },
    note: 'Las dimensiones del JSON son orientativas; la escala física no está confirmada.' });
  for (const kind of ['rooms', 'walls', 'openings', 'objects']) {
    for (const item of project[kind]) {
      if (item.source?.review === 'unreviewed' || item.source?.method === 'suggested') add({
        severity: 'info', category: 'provenance', elementType: kind, elementId: item.id,
        rule: 'source.review_or_method', evidence: { review: item.source.review, method: item.source.method },
      });
      if (kind === 'openings' && item.kind === 'door' && !item.swing) add({
        severity: 'incomplete', category: 'element', elementType: kind, elementId: item.id,
        rule: 'door.swing_optional', evidence: 'Falta bisagra o lado; no se puede evaluar el barrido de la puerta.',
      });
    }
  }
  try {
    const spatial = Spatial.createSpatialIndex(project);
    for (const kind of ['walls', 'openings', 'objects']) for (const item of project[kind]) {
      const relation = spatial.relation(kind, item);
      if (relation.status === 'ambiguous' || relation.status === 'unattributed') add({
        severity: relation.status === 'ambiguous' ? 'ambiguous' : 'incomplete',
        category: 'spatial_relation', elementType: kind, elementId: item.id,
        rule: relation.method, evidence: { status: relation.status, roomIds: relation.roomIds,
          ...(relation.reason ? { reason: relation.reason } : {}),
          ...(relation.storedRoomId ? { storedRoomId: relation.storedRoomId } : {}) },
      });
    }
  } catch (error) {
    add({ severity: 'incomplete', category: 'geometry', rule: 'spatial_projection',
      evidence: String(error.message || 'No se pudo derivar la geometría.').slice(0, 220) });
    return { snapshot, status: 'partial', valid: true, totalFindings, findings,
      truncated: totalFindings > findings.length,
      checks: { contract: 'passed', references: 'passed', geometry: 'partial', spatialRelations: 'not_run' } };
  }
  return { snapshot, status: totalFindings ? 'findings' : 'checked', valid: true, totalFindings, findings,
    truncated: totalFindings > findings.length,
    checks: { contract: 'passed', references: 'passed', geometry: 'passed', spatialRelations: 'passed' },
    note: 'Los hallazgos informativos y espaciales no son infracciones normativas.' };
}

module.exports = { diagnose };
