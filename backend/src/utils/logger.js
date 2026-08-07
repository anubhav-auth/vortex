import { env, isProd } from '../config/env.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[env.LOG_LEVEL];

const emit = (level, msg, meta) => {
  if (LEVELS[level] < threshold) return;
  const record = { ts: new Date().toISOString(), level, msg, ...meta };
  const line = isProd ? JSON.stringify(record) : formatPretty(record);
  (level === 'error' || level === 'warn' ? process.stderr : process.stdout).write(line + '\n');
};

const formatPretty = ({ ts, level, msg, ...rest }) => {
  const tag = level.toUpperCase().padEnd(5);
  const extras = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
  return `${ts} ${tag} ${msg}${extras}`;
};

export const logger = {
  debug: (msg, meta) => emit('debug', msg, meta),
  info: (msg, meta) => emit('info', msg, meta),
  warn: (msg, meta) => emit('warn', msg, meta),
  error: (msg, meta) => emit('error', msg, meta),
};
