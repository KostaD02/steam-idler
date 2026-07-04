const fs = require('fs');
const path = require('path');

const express = require('express');

const app = express();
const PORT = process.env.CLIENT_PORT || 2222;

const BASE_URL = path.join(__dirname, 'steam-idler-client-dist');
const CONFIG_PATH = path.join(BASE_URL, 'config.json');
const DEFAULT_LOG_TYPE = 2;

function toLogType(value) {
  const parsed = Number(value);

  return parsed === 0 || parsed === 1 || parsed === 2
    ? parsed
    : DEFAULT_LOG_TYPE;
}

function loadRuntimeConfig() {
  let config = {};

  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    console.warn(
      '[CLIENT] [WARN] config.json is missing from the build, it will be generated from environment variables',
    );
  }

  const { CLIENT_LOG_TYPE } = process.env;

  if (CLIENT_LOG_TYPE !== undefined) {
    config.logType = toLogType(CLIENT_LOG_TYPE);
  }

  return config;
}

function resolveApiBase(req) {
  const { API_BASE, SERVER_IP, SERVER_PORT } = process.env;

  if (API_BASE) {
    return API_BASE;
  }

  if (SERVER_IP) {
    return `http://${SERVER_IP}:${SERVER_PORT || '2221'}/api`;
  }

  const hostname = req.hostname || 'localhost';

  return `${req.protocol}://${hostname}:${SERVER_PORT || '2221'}/api`;
}

const runtimeConfig = loadRuntimeConfig();

app.get('/config.json', (req, res) => {
  res.json({ ...runtimeConfig, apiBase: resolveApiBase(req) });
});

app.use(express.static(BASE_URL));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(BASE_URL, 'index.html'));
});

app.listen(PORT, () => {
  console.log(
    `[CLIENT] [LOG] [${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] Client server is running on http://YOUR_LOCAL_IP_ADDRESS:${PORT}`,
  );
});
