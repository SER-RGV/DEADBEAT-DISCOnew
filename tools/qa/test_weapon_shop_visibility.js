#!/usr/bin/env node
"use strict";

/*
 * Regresión de visibilidad de la armería.
 * Abre la UI real sin iniciar partida ni comprar/equipar armas.
 *
 * Uso:
 *   DD_CHROMIUM=/ruta/a/chromium node tools/qa/test_weapon_shop_visibility.js [BASE_URL] [OUT_DIR]
 *
 * Requiere playwright-core y servidor estático en la raíz del repositorio.
 */
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const path = require("node:path");

const BASE = (process.argv[2] || "http://localhost:8080").replace(/\/+$/, "");
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const URL = BASE + "/index.html";
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok, detail: detail == null ? "" : String(detail) });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " · " + detail : ""));
};

async function main() {
  if (OUT) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM || undefined,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
    env: { ...process.env }
  });

  const pageErrors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });
    check("index.html responde HTTP 200", !!response && response.status() === 200, response && response.status());

    await page.waitForFunction(
      () => !!(window.DD_UI && window.__DD_BRIDGE &&
        typeof window.__DD_BRIDGE.getWeaponsList === "function" &&
        typeof window.__DD_BRIDGE.getSnapshot === "function" &&
        Array.isArray(window.__DD_BRIDGE.getWeaponsList()) &&
        window.__DD_BRIDGE.getWeaponsList().length > 0),
      null,
      { timeout: 60000 }
    );

    const before = await page.evaluate(() => {
      const catalog = window.__DD_BRIDGE.getWeaponsList();
      if (!Array.isArray(catalog)) throw new Error("getWeaponsList() no devuelve un array");
      const initialSnapshot = window.__DD_BRIDGE.getSnapshot();
      const initialOwned = Array.isArray(initialSnapshot.owned) ? initialSnapshot.owned.slice().sort() : [];
      const initialCredits = initialSnapshot.credits;
      const initialSelectedWeaponId = window.DD_UI.getState().selectedWeaponId;
      window.DD_UI.openShop();
      const cards = Array.from(document.querySelectorAll("#dd-weapons-grid .dd-weapon-card"));
      const active = document.querySelector("#dd-shop-filters .dd-filter-chip.active");
      return {
        catalogCount: catalog.length,
        catalogIds: catalog.map((weapon) => String(weapon.id)),
        initialCredits,
        initialOwned,
        initialSelectedWeaponId,
        catalogCategories: Array.from(new Set(catalog.map((weapon) => String((weapon.category || "OTRAS").toUpperCase())))),
        categoryById: catalog.map((weapon) => String((weapon.category || "OTRAS").toUpperCase())),
        cardCount: cards.length,
        cardIds: cards.map((card) => card.getAttribute("data-w")),
        activeFilter: active ? active.getAttribute("data-cat") : null,
        allFilter: !!document.querySelector('#dd-shop-filters .dd-filter-chip[data-cat="TODAS"]')
      };
    });

    check("el filtro inicial es TODAS", before.activeFilter === "TODAS", before.activeFilter);
    check("el chip TODAS existe", before.allFilter);
    check("todas las armas del catálogo aparecen al abrir", before.cardCount === before.catalogCount,
      before.cardCount + " tarjetas / " + before.catalogCount + " registros");

    const duplicateIds = before.catalogIds.filter((id, index) => before.catalogIds.indexOf(id) !== index);
    const missingIds = before.catalogIds.filter((id) => !before.cardIds.includes(id));
    const extraIds = before.cardIds.filter((id) => !before.catalogIds.includes(id));
    check("no hay IDs duplicados en catálogo", duplicateIds.length === 0, duplicateIds.join(", "));
    check("no faltan armas en la tienda", missingIds.length === 0, missingIds.join(", "));
    check("no hay tarjetas ajenas al catálogo", extraIds.length === 0, extraIds.join(", "));

    const categoryResults = [];
    for (const category of before.catalogCategories) {
      const count = await page.evaluate((category) => {
        const chip = Array.from(document.querySelectorAll("#dd-shop-filters .dd-filter-chip"))
          .find((node) => node.getAttribute("data-cat") === category);
        if (!chip) return { found: false, count: 0 };
        chip.click();
        return {
          found: true,
          count: document.querySelectorAll("#dd-weapons-grid .dd-weapon-card").length
        };
      }, category);
      const expected = before.categoryById.filter((raw) => raw === category).length;
      categoryResults.push({ category, expected, actual: count.count, found: count.found });
      check("filtro de categoría " + category, count.found && count.count === expected,
        count.count + " tarjetas / " + expected + " esperadas");
    }

    await page.evaluate(() => {
      const all = document.querySelector('#dd-shop-filters .dd-filter-chip[data-cat="TODAS"]');
      if (all) all.click();
    });
    const after = await page.evaluate(() => {
      const snapshot = window.__DD_BRIDGE.getSnapshot();
      return {
        credits: snapshot.credits,
        owned: Array.isArray(snapshot.owned) ? snapshot.owned.slice().sort() : [],
        selectedWeaponId: window.DD_UI.getState().selectedWeaponId,
        cardCount: document.querySelectorAll("#dd-weapons-grid .dd-weapon-card").length,
        gridClientHeight: document.getElementById("dd-weapons-grid").clientHeight,
        gridScrollHeight: document.getElementById("dd-weapons-grid").scrollHeight,
        gridOverflowY: getComputedStyle(document.getElementById("dd-weapons-grid")).overflowY
      };
    });
    check("la auditoría no altera créditos, armas propias ni arma seleccionada",
      after.credits === before.initialCredits &&
      JSON.stringify(after.owned) === JSON.stringify(before.initialOwned) &&
      after.selectedWeaponId === before.initialSelectedWeaponId,
      "créditos " + after.credits + "; propias " + after.owned.length + "; seleccionada " + after.selectedWeaponId);
    check("la lista vuelve a mostrar todas las armas tras recorrer categorías",
      after.cardCount === before.catalogCount, after.cardCount + " / " + before.catalogCount);
    check("el grid permite desplazamiento vertical", ["auto", "scroll"].includes(after.gridOverflowY),
      "overflow-y: " + after.gridOverflowY);
    if (after.cardCount > 0 && after.gridScrollHeight > after.gridClientHeight) {
      check("la lista larga necesita scroll y el contenido excede el viewport",
        after.gridScrollHeight > after.gridClientHeight,
        after.gridScrollHeight + " px / " + after.gridClientHeight + " px");
    }

    if (OUT) {
      await page.screenshot({ path: path.join(OUT, "weapon_shop_all_categories.png"), fullPage: false });
      fs.writeFileSync(path.join(OUT, "weapon_shop_visibility.json"), JSON.stringify({
        capturedAt: new Date().toISOString(),
        before,
        duplicateIds,
        missingIds,
        extraIds,
        categoryResults,
        after,
        pageErrors,
        results
      }, null, 2) + "\n", "utf8");
    }

    check("sin errores JavaScript de página", pageErrors.length === 0, pageErrors.join(" | "));
    const failed = results.filter((result) => !result.ok);
    console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
    await context.close();
    if (failed.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("WEAPON SHOP VISIBILITY TEST FAILED:", error && error.stack || error);
  process.exitCode = 1;
});
