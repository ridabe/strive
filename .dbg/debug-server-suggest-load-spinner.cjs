const http = require('http');
const fs = require('fs');
const path = require('path');
const sessionId = 'suggest-load-spinner';
const outDir = path.resolve('.dbg');
const logFile = path.join(outDir, `trae-debug-log-${sessionId}.ndjson`);
const envFile = path.join(outDir, `${sessionId}.env`);
const host = '127.0.0.1';
const startPort = 7777;
const maxRetries = 10;
let lastActivity = Date.now();
const idleMs = 1200 * 1000;
fs.mkdirSync(outDir, { recursive: true });
try { fs.writeFileSync(logFile, ''); } catch {}
function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, DELETE'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); }
function writeEnv(port) {
  const apiUrl = `http://${host}:${port}/event`;
  fs.writeFileSync(envFile, `DEBUG_SERVER_URL=${apiUrl}\nDEBUG_SESSION_ID=${sessionId}\n`);
  console.log('@@DEBUG_SERVER_INFO');
  console.log(JSON.stringify({ api_url: apiUrl, session_id: sessionId, log_dir: outDir, log_file: logFile, env_file: envFile }, null, 2));
  console.log('@@END_DEBUG_SERVER_INFO');
}
function start(port, tries = 0) {
  const server = http.createServer((req, res) => {
    lastActivity = Date.now();
    cors(res);
    if (req.method === 'OPTIONS' && req.url === '/event') { res.writeHead(204); return res.end(); }
    if (req.method === 'GET' && req.url.startsWith('/health')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: true, sessionId, uptimeMs: Date.now() - lastActivity })); }
    if (req.method === 'GET' && req.url.startsWith('/logs')) {
      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
      return res.end(fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '');
    }
    if (req.method === 'DELETE' && req.url.startsWith('/logs')) { fs.writeFileSync(logFile, ''); res.writeHead(200); return res.end('ok'); }
    if (req.method === 'POST' && req.url === '/event') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const event = JSON.parse(body || '{}');
          if (!event.ts) event.ts = Date.now();
          fs.appendFileSync(logFile, JSON.stringify(event) + '\n');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      });
      return;
    }
    res.writeHead(404); res.end('not found');
  });
  server.on('error', err => {
    if (err && err.code === 'EADDRINUSE' && tries < maxRetries) return start(port + 1, tries + 1);
    throw err;
  });
  server.listen(port, host, () => writeEnv(port));
  setInterval(() => { if (Date.now() - lastActivity > idleMs) process.exit(0); }, 5000);
}
start(startPort);
