const path = require('path');
const serverless = require('serverless-http');

// Resolve backend deps from backend/node_modules during Netlify builds
module.paths.unshift(path.join(__dirname, '../../backend/node_modules'));

const { app, ensureDb } = require('../../backend/server');

const expressHandler = serverless(app);

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
