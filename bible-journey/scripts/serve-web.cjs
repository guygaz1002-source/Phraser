// Serves the exported web build (dist/) on the local network, for trying the game on a phone.
// Unknown paths fall back to index.html, so reloading in the middle of a journey works.
// Usage: node scripts/serve-web.cjs [directory] [port]
const http = require("http"), fs = require("fs"), os = require("os"), path = require("path"), zlib = require("zlib");

const root = path.resolve(process.argv[2] || "dist"), port = Number(process.argv[3]) || 8090;
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ttf": "font/ttf", ".css": "text/css; charset=utf-8" };
if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(`No index.html in ${root}. Run "npx expo export --platform web" first.`);
  process.exit(1);
}
http.createServer((request, response) => {
  let file = path.join(root, decodeURIComponent(new URL(request.url, "http://localhost").pathname));
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "index.html");
  const extension = path.extname(file), page = file.endsWith("index.html");
  const headers = { "Content-Type": types[extension] || "application/octet-stream", "Cache-Control": page ? "no-cache" : "public, max-age=3600" };
  const compress = [".html", ".js", ".json", ".css"].includes(extension) && /\bgzip\b/.test(String(request.headers["accept-encoding"]));
  if (compress) headers["Content-Encoding"] = "gzip";
  response.writeHead(200, headers);
  const stream = fs.createReadStream(file);
  (compress ? stream.pipe(zlib.createGzip()) : stream).pipe(response);
}).listen(port, "0.0.0.0", () => {
  const addresses = Object.values(os.networkInterfaces()).flat().filter(a => a && a.family === "IPv4" && !a.internal).map(a => a.address);
  console.log(`Phraser web build: http://localhost:${port}`);
  for (const address of addresses) console.log(`On a phone (same Wi-Fi): http://${address}:${port}`);
});
