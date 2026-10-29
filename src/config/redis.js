const { createClient } = require('redis');
const { redisUrl } = require('./env');
const logger = require('../utils/logger');

const client = createClient({
  url: redisUrl,
  socket: {
    // node-redis retries forever by default, which would otherwise keep
    // client.connect()'s promise pending forever when Redis is simply not
    // running — give up after a few attempts instead of hanging server boot.
    reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000)),
  },
});

client.on('error', (err) => logger.warn('Redis client error:', err.message));

let connecting = null;
// Non-fatal by design: if Redis isn't reachable (not installed locally,
// wrong REDIS_URL, etc.) the server still starts and the app just runs
// without the /data list cache instead of refusing to boot. A hard timeout
// backs up the reconnectStrategy cap above, so boot is never blocked.
function connectRedis() {
  if (!connecting) {
    const attempt = client
      .connect()
      .then(() => logger.info('Redis connected'))
      .catch((err) => logger.warn(`Redis connection attempt failed: ${err.message}`));
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
    connecting = Promise.race([attempt, timeout]);
  }
  return connecting;
}

async function getJson(key) {
  if (!client.isOpen) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setJson(key, value, ttlSeconds) {
  if (!client.isOpen) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // caching is best-effort
  }
}

async function del(key) {
  if (!client.isOpen) return;
  try {
    await client.del(key);
  } catch {
    // caching is best-effort
  }
}

module.exports = { client, connectRedis, getJson, setJson, del };
