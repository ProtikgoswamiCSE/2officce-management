/**
 * Doptor Tech — local file database server
 * Data is stored in ./database/ as JSON files.
 * Run: node server.js
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { buildSeedData } = require("./database-seed");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DB_DIR = path.join(ROOT, "database");
const FILES = {
  store: path.join(DB_DIR, "store.json"),
  auth: path.join(DB_DIR, "auth.json"),
  meta: path.join(DB_DIR, "meta.json")
};

let dbVersion = 1;
const sseClients = new Set();

function ensureDatabase() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const needsSeed = !fs.existsSync(FILES.store) || !fs.existsSync(FILES.auth);
  if (needsSeed) {
    const seed = buildSeedData();
    fs.writeFileSync(FILES.store, JSON.stringify(seed.store, null, 2), "utf8");
    fs.writeFileSync(FILES.auth, JSON.stringify(seed.auth, null, 2), "utf8");
    fs.writeFileSync(FILES.meta, JSON.stringify(seed.meta, null, 2), "utf8");
    console.log("Created database files in ./database/");
  } else if (!fs.existsSync(FILES.meta)) {
    fs.writeFileSync(FILES.meta, JSON.stringify({}, null, 2), "utf8");
  }
}

function readJsonFile(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function writeJsonFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function loadBootstrap() {
  return {
    store: readJsonFile(FILES.store, {}),
    auth: readJsonFile(FILES.auth, {}),
    meta: readJsonFile(FILES.meta, {}),
    version: dbVersion
  };
}

function broadcastChange() {
  dbVersion += 1;
  const payload = `data: ${JSON.stringify({ version: dbVersion })}\n\n`;
  sseClients.forEach(res => {
    try { res.write(payload); } catch (_) {}
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      if (!raw) return resolve(null);
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/main.html";
  if (!path.extname(urlPath)) {
    const htmlPath = urlPath + ".html";
    const candidate = path.join(ROOT, path.normalize(htmlPath).replace(/^(\.\.[/\\])+/, ""));
    if (candidate.startsWith(ROOT) && fs.existsSync(candidate)) urlPath = htmlPath;
  }
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end("Not found"); return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate"
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res) {
  const url = req.url.split("?")[0];

  if (url === "/api/db/bootstrap" && req.method === "GET") {
    return sendJson(res, 200, loadBootstrap());
  }

  if (url === "/api/db/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    res.write(`data: ${JSON.stringify({ version: dbVersion })}\n\n`);
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  if (url === "/api/db/store" && req.method === "PUT") {
    const body = await readBody(req);
    writeJsonFile(FILES.store, body || {});
    broadcastChange();
    return sendJson(res, 200, { ok: true, version: dbVersion });
  }

  if (url === "/api/db/auth" && req.method === "PUT") {
    const body = await readBody(req);
    writeJsonFile(FILES.auth, body || {});
    broadcastChange();
    return sendJson(res, 200, { ok: true, version: dbVersion });
  }

  if (url === "/api/db/meta" && req.method === "PUT") {
    const body = await readBody(req);
    writeJsonFile(FILES.meta, body || {});
    broadcastChange();
    return sendJson(res, 200, { ok: true, version: dbVersion });
  }

  res.writeHead(404);
  res.end("API not found");
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) return await handleApi(req, res);
    return serveStatic(req, res);
  } catch (e) {
    console.error(e);
    sendJson(res, 500, { error: e.message || "Server error" });
  }
});

ensureDatabase();
server.listen(PORT, () => {
  console.log("");
  console.log("  Doptor Tech — File Database Server");
  console.log("  ----------------------------------");
  console.log(`  App:      http://localhost:${PORT}/main`);
  console.log(`  Database: ${DB_DIR}`);
  console.log("    - store.json  (projects, users, clients, profiles...)");
  console.log("    - auth.json   (login emails + passwords)");
  console.log("    - meta.json   (system flags)");
  console.log("");
});
