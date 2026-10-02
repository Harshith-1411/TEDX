const path = require('path');
const serverless = require('serverless-http');

// Resolve backend deps from candidate locations during Netlify runtime
const candidateModulePaths = [
  path.join(__dirname, '../../backend/node_modules'),
  path.join(__dirname, './backend/node_modules'),
  path.join(process.cwd(), 'backend/node_modules'),
  path.join(process.cwd(), 'node_modules'),
];
for (const p of candidateModulePaths) {
  if (!module.paths.includes(p)) {
    module.paths.unshift(p);
  }
}

// Resilient backend server resolution across local & bundled Netlify function environments
let backendModule;
const candidateServerPaths = [
  '../../backend/server',
  './backend/server',
  path.join(process.cwd(), 'backend/server'),
];

for (const candidate of candidateServerPaths) {
  try {
    backendModule = require(candidate);
    break;
  } catch {
    // Continue trying other candidates
  }
}

if (!backendModule) {
  backendModule = require('../../backend/server');
}

const { app, ensureDb } = backendModule;

const expressHandler = serverless(app, {
  binary: ['image/*', 'application/octet-stream', 'multipart/form-data'],
});

function normalizeApiPath(event) {
  const nextEvent = { ...event };
  const functionPrefix = '/.netlify/functions/api';

  const candidates = ['path', 'rawPath'];
  for (const key of candidates) {
    const value = nextEvent[key];
    if (typeof value !== 'string') continue;

    if (value.startsWith(functionPrefix)) {
      const rest = value.slice(functionPrefix.length) || '';
      nextEvent[key] = `/api${rest.startsWith('/') ? rest : `/${rest}`}`;
    } else if (!value.startsWith('/api')) {
      nextEvent[key] = `/api${value.startsWith('/') ? value : `/${value}`}`;
    }
  }

  return nextEvent;
}

exports.handler = async (event, context) => {
  // Reuse MongoDB connections across warm Netlify Function invocations
  context.callbackWaitsForEmptyEventLoop = false;
  await ensureDb();
  return expressHandler(normalizeApiPath(event), context);
};
