'use strict';
// Worker side of isolate.cjs: the same pure functions core.cjs calls in-process, on a structured clone of the validated
// project. No file access, no network, no writes; the result goes back by postMessage only.
const { workerData, parentPort } = require('node:worker_threads');
// Load the pure modules first (they read their own code), then lock the worker down before any computation.
const Proposal = require('./proposal.cjs');
const Route = require('./route.cjs');
const Review = require('../../../js/layout-review.js');
require('./lockdown.cjs').lockdown();

const TASKS = {
  proposeLayout: (project, snapshot, args) => Proposal.propose(project, snapshot, args),
  checkRoute2d: (project, snapshot, { start, end, widthMm }) => Route.findRoute(project, snapshot, { start, end, widthMm }),
  reviewLayout: (project, snapshot, args) => ({ snapshot, ...Review.review(project, { ...(args.clearanceMm === undefined ? {} : { clearanceMm: args.clearanceMm }) }) })
};

try {
  const { task, project, snapshot, args } = workerData;
  if (!Object.hasOwn(TASKS, task)) throw new Error('Cálculo no admitido.');
  parentPort.postMessage({ ok: true, result: TASKS[task](project, snapshot, args || {}) });
} catch (error) {
  parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : 'Error en el cálculo.' });
}
