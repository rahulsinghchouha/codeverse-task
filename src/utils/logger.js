const levels = ['error', 'warn', 'info', 'debug'];

const logger = levels.reduce((acc, level) => {
  acc[level] = (...args) => console[level === 'debug' ? 'log' : level](`[${level.toUpperCase()}]`, ...args);
  return acc;
}, {});

module.exports = logger;
