'use strict';

const { createHash } = require('node:crypto');
const C = require('../../../js/project-core.js');
const Variants = require('../../../js/project-variants.js');
const ProposalV1 = require('../../../js/proposal-core.js');
const Proposal = require('./proposal.cjs');

const VERSION = 'RubikLayoutSimulationV1';
const digest = value => createHash('sha256').update(value).digest('hex');

function simulate(project, snapshot, args = {}) {
  const { clearanceMm, ...request } = args;
  if (clearanceMm !== undefined && (!Number.isFinite(clearanceMm) || clearanceMm <= 0 || clearanceMm > 100000)) {
    throw new Error('Indica una holgura positiva de hasta 100.000 mm o déjala sin especificar.');
  }
  const normalized = Proposal.normalize(request);
  const result = Proposal.propose(project, snapshot, normalized);
  const proposal = Proposal.toProposalV1(result);
  const response = {
    version: VERSION,
    status: result.status,
    source: result.source,
    request: { ...normalized, ...(clearanceMm === undefined ? {} : { clearanceMm }) },
    proposal,
    applied: false,
  };
  if (result.status !== 'candidate-reviewable') {
    return { report: { ...response, reasons: result.blockingReasons, notEvaluated: result.notEvaluated } };
  }

  const check = ProposalV1.validate(proposal);
  if (!check.ok || !ProposalV1.checkFresh(proposal.base, snapshot.sha256).ok) {
    throw new Error('La propuesta ya no corresponde al JSON elegido. Vuelve a calcularla.');
  }
  const [change] = proposal.changes;
  const next = C.clone(project);
  const object = next.objects.find(item => item.id === normalized.objectId);
  if (proposal.changes.length !== 1 || !object || change.path !== `objects[${object.id}].position`
      || object.position.x !== change.before.x || object.position.y !== change.before.y) {
    throw new Error('La propuesta excede el alcance de una posición de mueble. El original sigue intacto.');
  }
  object.position = { ...object.position, x: change.after.x, y: change.after.y };
  C.validate(next);
  const comparison = {
    before: Variants.metrics(project, { clearanceMm }),
    after: Variants.metrics(next, { clearanceMm }),
  };
  const report = {
    ...response,
    comparison,
    affected: [{ id: object.id, before: result.currentPose, after: result.suggestedPose }],
    notEvaluated: result.notEvaluated.filter(item => clearanceMm === undefined || item.code !== 'clearance'),
  };
  return { report: { ...report, simulationSha256: digest(JSON.stringify(report)) }, project: next };
}

module.exports = { simulate, digest };
