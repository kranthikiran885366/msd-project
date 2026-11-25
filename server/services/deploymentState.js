'use strict';
const transitions = {
  pending: ['building', 'failed', 'cancelled'],
  building: ['deploying', 'failed', 'cancelled'],
  deploying: ['running', 'failed', 'cancelled'],
  running: ['failed', 'rolled-back'],
  failed: [], cancelled: [], 'rolled-back': [],
};
function canTransition(from, to) {
  return Object.hasOwn(transitions, from) && (from === to || transitions[from].includes(to));
}
module.exports = { canTransition };
