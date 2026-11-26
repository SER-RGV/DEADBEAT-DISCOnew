/* ==========================================================================
   Servidor estático mínimo para las pruebas.

   El juego se sirve por HTTP (no file://): así el navegador aplica las mismas
   reglas de origen, caché y MIME que en producción, y los 404 se pueden
   detectar de verdad. Sin dependencias y con soporte de Range, porque el audio
   y el vídeo de las cinemáticas lo usan.
   ========================================================================== */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

/**
 * Sirve `root` en un puerto libre sobre todas las interfaces.
 * @returns {Promise<{url: string, port: number, close: Function, requests: Array}>}
 */
function start(root, options) {
  const o = options || {};
  const base = path.resolve(root);
  const requests = [];

  const server = http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      res.writeHead(400).end('bad request');
      return;
    }
    if (pathname === '/') pathname = '/index.html';

    const file = path.join(base, path.normalize(pathname));
    if (!file.startsWith(base)) { res.writeHead(403).end('forbidden'); return; }

    fs.stat(file, (err, stat) => {
      requests.push({ url: pathname, status: err ? 404 : 200 });
      if (err || !stat.isFile()) { res.writeHead(404).end('not found'); return; }

      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const headers = { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };

      const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (range) {
        const start0 = range[1] ? parseInt(range[1], 10) : 0;
        const end0 = range[2] ? parseInt(range[2], 10) : stat.size - 1;
        if (start0 >= stat.size || end0 >= stat.size || start0 > end0) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size }).end();
          return;
        }
        headers['Content-Range'] = 'bytes ' + start0 + '-' + end0 + '/' + stat.size;
        headers['Content-Length'] = end0 - start0 + 1;
        res.writeHead(206, headers);
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(file, { start: start0, end: end0 }).pipe(res);
        return;
      }

      headers['Content-Length'] = stat.size;
      res.writeHead(200, headers);
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).pipe(res);
    });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(o.port || 0, o.host || '0.0.0.0', () => {
      const port = server.address().port;
      resolve({
        url: 'http://127.0.0.1:' + port,
        port,
        requests,
        close: () => new Promise((done) => server.close(() => done()))
      });
    });
  });
}

module.exports = { start };
