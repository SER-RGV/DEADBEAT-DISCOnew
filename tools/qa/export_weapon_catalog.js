#!/usr/bin/env node
"use strict";

/*
 * Exporta el catálogo REAL expuesto por el puente del motor de index.html.
 * Uso: DD_CHROMIUM=/ruta/a/chromium node tools/qa/export_weapon_catalog.js [BASE_URL] [OUT_DIR]
 * Requiere playwright-core y un servidor estático en la raíz del repositorio.
 * No compra/equipa armas ni modifica el almacenamiento del juego.
 */
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const path = require("node:path");

const BASE = (process.argv[2] || "http://localhost:8080").replace(/\/+$/, "");
const OUT = path.resolve(process.argv[3] || "artifacts/weapon-catalog");
const URL = BASE + "/index.html";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}
function toCsv(rows, columns) {
  return [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(","))].join("\n") + "\n";
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM || undefined,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
    env: { ...process.env }
  });
  const pageErrors = [];
  const consoleErrors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !/willReadFrequently/.test(message.text())) consoleErrors.push(message.text().slice(0, 500));
    });

    const response = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });
    if (!response || response.status() !== 200) throw new Error("index.html no respondió HTTP 200: " + (response && response.status()));

    await page.waitForFunction(() => !!(window.DD_BOOT && window.DD_UI && window.__DD_BRIDGE), null, { timeout: 60000 });
    await page.waitForFunction(
      () => window.DD_BOOT.getState().waitingGesture || window.DD_BOOT.getState().state === "INTRO",
      null,
      { timeout: 60000 }
    );

    // Reproduce el arranque QA documentado: gesto -> intro -> menú.
    await page.keyboard.press("KeyX");
    await page.waitForFunction(() => window.DD_OPENING && window.DD_OPENING.isActive(), null, { timeout: 15000 });
    await sleep(600);
    await page.keyboard.press("Space");
    await page.waitForFunction(() => window.DD_BOOT.getState().state === "MAIN_MENU", null, { timeout: 15000 });

    const apiCheck = await page.evaluate(() => {
      const bridge = window.__DD_BRIDGE;
      return {
        getWeaponsList: typeof bridge.getWeaponsList === "function",
        getWeaponStats: typeof bridge.getWeaponStats === "function",
        getSnapshot: typeof bridge.getSnapshot === "function",
        openShop: typeof window.DD_UI.openShop === "function",
        assetManifest: !!(window.DD_ASSETS && window.DD_ASSETS.manifest && window.DD_ASSETS.manifest.entries),
        hdData: !!window.__HD_DATA
      };
    });
    if (!apiCheck.getWeaponsList || !apiCheck.getWeaponStats) {
      throw new Error("El puente no expone getWeaponsList() y getWeaponStats(id): " + JSON.stringify(apiCheck));
    }

    // Abre la armería sin ejecutar acciones de compra/equipamiento.
    await page.evaluate(() => window.DD_UI.openShop());
    await page.waitForFunction(() => !!document.getElementById("dd-weapons-grid"), null, { timeout: 10000 });
    await sleep(250);

    // Registra el estado inicial de la tienda y después fuerza el filtro TODAS.
    // Esto evita que un sentinel interno distinto de "TODAS" oculte armas en la captura.
    const initialShopState = await page.evaluate(() => {
      const active = document.querySelector("#dd-shop-filters .dd-filter-chip.active");
      const renderedCards = document.querySelectorAll("#dd-weapons-grid .dd-weapon-card").length;
      const catalogRecords = window.__DD_BRIDGE.getWeaponsList().length;
      const activeFilter = active && active.dataset ? active.dataset.cat : null;
      return {
        renderedCards,
        catalogRecords,
        activeFilter,
        allFilterExists: !!document.querySelector('#dd-shop-filters .dd-filter-chip[data-cat="TODAS"]'),
        initialFilterMismatch: activeFilter !== "TODAS",
        initialEmptyDespiteCatalog: renderedCards === 0 && catalogRecords > 0
      };
    });
    const allFilterClicked = await page.evaluate(() => {
      const button = document.querySelector('#dd-shop-filters .dd-filter-chip[data-cat="TODAS"]');
      if (!button) return false;
      button.click();
      return true;
    });
    if (allFilterClicked) await sleep(150);

    const extracted = await page.evaluate((probeState) => {
      const bridge = window.__DD_BRIDGE;
      const rawList = bridge.getWeaponsList();
      if (!Array.isArray(rawList)) throw new Error("getWeaponsList() no devolvió un array");

      const entries = window.DD_ASSETS && window.DD_ASSETS.manifest && window.DD_ASSETS.manifest.entries
        ? window.DD_ASSETS.manifest.entries : {};
      const hdData = window.__HD_DATA || {};
      const uiCards = Array.from(document.querySelectorAll("#dd-weapons-grid .dd-weapon-card"))
        .map((card) => card.getAttribute("data-w"));

      const rows = rawList.map((weapon, index) => {
        const id = weapon && weapon.id != null ? String(weapon.id) : "";
        let stats = null;
        try { stats = bridge.getWeaponStats(id); }
        catch (error) { stats = { __error: String(error && error.message || error) }; }
        const manifestKey = "weapon_" + id;
        const hdKey = "weapons/weapon_" + id + ".png";
        return {
          index, id,
          name: weapon && weapon.name != null ? String(weapon.name) : "",
          category: weapon && weapon.category != null ? String(weapon.category) : "",
          price: weapon && weapon.price != null ? weapon.price : null,
          source_record: weapon,
          stats,
          manifest_asset: Object.prototype.hasOwnProperty.call(entries, manifestKey),
          manifest_asset_path: entries[manifestKey] ? entries[manifestKey].src : null,
          hd_data_asset: Object.prototype.hasOwnProperty.call(hdData, hdKey),
          hd_data_key: Object.prototype.hasOwnProperty.call(hdData, hdKey) ? hdKey : null,
          rendered_in_shop: uiCards.includes(id)
        };
      });
      const hdWeaponKeys = Object.keys(hdData).filter((key) => /^weapons\/weapon_.+\.png$/.test(key));
      const manifestWeaponKeys = Object.keys(entries).filter((key) => /^weapon_.+/.test(key));
      const ids = rows.map((row) => row.id);
      const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
      return {
        capturedAt: new Date().toISOString(),
        source: "window.__DD_BRIDGE.getWeaponsList() + getWeaponStats(id)",
        totalRecords: rows.length,
        uniqueIds: Array.from(new Set(ids)).length,
        duplicateIds: Array.from(new Set(duplicateIds)),
        renderedCards: uiCards.length,
        renderedCardIds: uiCards,
        initialShopState: probeState.initialShopState,
        allFilterClicked: probeState.allFilterClicked,
        hdWeaponAssetKeys: hdWeaponKeys,
        manifestWeaponAssetKeys: manifestWeaponKeys,
        rows
      };
    }, { initialShopState, allFilterClicked });

    const rawPath = path.join(OUT, "weapon_catalog_raw.json");
    const csvPath = path.join(OUT, "weapon_catalog_normalized.csv");
    const coveragePath = path.join(OUT, "weapon_asset_coverage.json");
    const reportPath = path.join(OUT, "weapon_catalog_audit.md");

    const csvRows = extracted.rows.map((row) => ({
      id: row.id, name: row.name, category: row.category, price: row.price,
      stats_json: JSON.stringify(row.stats),
      manifest_asset: row.manifest_asset, manifest_asset_path: row.manifest_asset_path,
      hd_data_asset: row.hd_data_asset, rendered_in_shop: row.rendered_in_shop
    }));
    fs.writeFileSync(csvPath, toCsv(csvRows, [
      "id", "name", "category", "price", "stats_json",
      "manifest_asset", "manifest_asset_path", "hd_data_asset", "rendered_in_shop"
    ]), "utf8");

    const coverage = {
      capturedAt: extracted.capturedAt,
      totalCatalogRecords: extracted.totalRecords,
      uniqueCatalogIds: extracted.uniqueIds,
      duplicateIds: extracted.duplicateIds,
      rows: extracted.rows.map((row) => ({
        id: row.id, manifestAsset: row.manifest_asset, manifestAssetPath: row.manifest_asset_path,
        hdDataAsset: row.hd_data_asset, renderedInShop: row.rendered_in_shop
      })),
      orphanHdWeaponAssetKeys: extracted.hdWeaponAssetKeys.filter((key) => {
        const id = key.replace(/^weapons\/weapon_/, "").replace(/\.png$/, "");
        return !extracted.rows.some((row) => row.id === id);
      }),
      orphanManifestWeaponAssetKeys: extracted.manifestWeaponAssetKeys.filter((key) => {
        const id = key.replace(/^weapon_/, "");
        return !extracted.rows.some((row) => row.id === id);
      })
    };
    fs.writeFileSync(coveragePath, JSON.stringify(coverage, null, 2) + "\n", "utf8");

    const report = [
      "# Auditoría runtime del catálogo de armas", "",
      "- Fecha: " + extracted.capturedAt,
      "- Fuente: __DD_BRIDGE.getWeaponsList() y getWeaponStats(id) de index.html.",
      "- Registros: **" + extracted.totalRecords + "**",
      "- IDs únicos: **" + extracted.uniqueIds + "**",
      "- IDs duplicados: **" + extracted.duplicateIds.length + "**",
      "- Tarjetas renderizadas en la armería tras filtro TODAS: **" + extracted.renderedCards + "**",
      "- Tarjetas al abrir la armería: **" + extracted.initialShopState.renderedCards + "**",
      "- Registros de catálogo antes del filtro: **" + extracted.initialShopState.catalogRecords + "**",
      "- Filtro inicial distinto de TODAS: **" + extracted.initialShopState.initialFilterMismatch + "**",
      "- Tienda inicialmente vacía pese a existir catálogo: **" + extracted.initialShopState.initialEmptyDespiteCatalog + "**",
      "- Filtro TODAS encontrado y pulsado: **" + extracted.allFilterClicked + "**",
      "- Recursos HD de armas: **" + extracted.hdWeaponAssetKeys.length + "**",
      "- Recursos de armas en DD_ASSETS: **" + extracted.manifestWeaponAssetKeys.length + "**", "",
      "## Discrepancias", "",
      "- IDs duplicados: " + (extracted.duplicateIds.join(", ") || "ninguno detectado"),
      "- Tarjetas no renderizadas: " + (extracted.rows.filter((row) => !row.rendered_in_shop).map((row) => row.id).join(", ") || "ninguna"),
      "- Registros sin recurso manifest ni HD: " + (extracted.rows.filter((row) => !row.manifest_asset && !row.hd_data_asset).map((row) => row.id).join(", ") || "ninguno"), "",
      "## Archivos generados", "",
      "- weapon_catalog_raw.json: respuesta original del puente y estadísticas por ID.",
      "- weapon_catalog_normalized.csv: una fila por registro, con estadísticas serializadas.",
      "- weapon_asset_coverage.json: cobertura entre catálogo, manifest, HD data y UI.", "",
      "## Errores de navegador", "",
      "- pageerror: " + pageErrors.length,
      "- console error: " + consoleErrors.length, ""
    ].join("\n");
    extracted.browserErrors = { page: pageErrors, console: consoleErrors };
    fs.writeFileSync(rawPath, JSON.stringify(extracted, null, 2) + "\n", "utf8");
    fs.writeFileSync(reportPath, report, "utf8");

    console.log(JSON.stringify({
      ok: true, totalRecords: extracted.totalRecords, uniqueIds: extracted.uniqueIds,
      duplicateIds: extracted.duplicateIds, renderedCards: extracted.renderedCards,
      output: OUT, files: [rawPath, csvPath, coveragePath, reportPath],
      pageErrors: pageErrors.length, consoleErrors: consoleErrors.length
    }, null, 2));
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("WEAPON CATALOG EXPORT FAILED:", error && error.stack || error);
  process.exitCode = 1;
});
