const subscribers = [];
let deferJobs = false;
const queuedJobs = [];

export const sentEvents = [];

export function emitScriptEvent(id, message) {
  const event = { id, message };
  for (const subscriber of [...subscribers]) subscriber(event);
}

export function setDeferredJobs(value) {
  deferJobs = value === true;
}

export function queuedJobCount() {
  return queuedJobs.length;
}

export function flushJobs() {
  while (queuedJobs.length) {
    const generator = queuedJobs.shift();
    for (const ignored of generator) void ignored;
  }
}

function emptyRegistry() {
  return Object.freeze({
    getAll: () => [],
    get: () => undefined
  });
}

export const BiomeTypes = emptyRegistry();
export const BlockTypes = emptyRegistry();
export const EntityTypes = emptyRegistry();
export const ItemTypes = emptyRegistry();

export const system = {
  currentTick: 0,
  afterEvents: {
    scriptEventReceive: {
      subscribe(callback) {
        subscribers.push(callback);
      }
    }
  },
  run(callback) {
    callback();
    return 1;
  },
  runJob(generator) {
    if (deferJobs) {
      queuedJobs.push(generator);
      return 2;
    }
    for (const ignored of generator) void ignored;
    return 2;
  },
  sendScriptEvent(id, message) {
    sentEvents.push({ id, message });
    emitScriptEvent(id, message);
  }
};
