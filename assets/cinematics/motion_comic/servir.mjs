#!/usr/bin/env node
/* DEADBEAT DISCO · Motion comic · servidor local de la vista previa.
   Uso:  node assets/cinematics/motion_comic/servir.mjs [puerto]
   Sirve el repositorio en modo de solo lectura y abre la vista previa en la raíz. No modifica ningún archivo. */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, "../../..");
const PREVIA = "/assets/cinematics/motion_comic/";
const PUERTO = parseInt(process.argv[2] || process.env.PORT || "8045", 10);
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

http
  .createServer((req, res) => {
    let ruta;
    try {
      ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      res.writeHead(400).end("Dirección no válida");
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end("Solo lectura");
      return;
    }
    if (ruta === "/") {
      res.writeHead(302, { Location: PREVIA + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") }).end();
      return;
    }
    let archivo = path.join(REPO, ruta);
    if (!archivo.startsWith(REPO + path.sep) || ruta.split("/").some((s) => s.startsWith(".git"))) {
      res.writeHead(403).end("No permitido");
      return;
    }
    fs.stat(archivo, (err, st) => {
      if (!err && st.isDirectory()) {
        if (!ruta.endsWith("/")) {
          res.writeHead(302, { Location: ruta + "/" }).end();
          return;
        }
        archivo = path.join(archivo, "index.html");
      }
      fs.stat(archivo, (err2, st2) => {
        if (err2 || !st2.isFile()) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("No encontrado: " + ruta);
          return;
        }
        res.writeHead(200, {
          "Content-Type": TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream",
          "Content-Length": st2.size,
          "Cache-Control": "no-store",
        });
        if (req.method === "HEAD") res.end();
        else fs.createReadStream(archivo).pipe(res);
      });
    });
  })
  .listen(PUERTO, "0.0.0.0", () => {
    console.log(`Vista previa del motion comic: http://localhost:${PUERTO}/`);
  });
