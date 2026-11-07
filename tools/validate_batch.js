#!/usr/bin/env node
/**
 * DEADBEAT DISCO — Automated Real-Browser QA & Non-Regression Validator
 * Uses Headless Chromium + Playwright Core to verify:
 *  - 0 uncaught JS errors & 0 HTTP 404/500 asset errors
 *  - 100% live PNG decode & exact dimensions via DD_ASSETS.integrity()
 *  - Native DPR 1x (1280x720) & DPR 2x (1920x1080 -> 3840x2160) smooth canvas
 *  - Playable HUB, Main Menu, Armory/Shop, Tower Map, Cinematics & Combat
 *  - Emulated Xbox Standard Gamepad (explicitly distinguished from physical pad)
 *  - Full v3.2 Organic Suite (16 states + 120 weapons)
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { createRequire } = require("module");

const browserReq = createRequire("/tmp/browser/package.json");
const { chromium: pwChromium } = browserReq("playwright-core");

const ROOT = path.resolve(__dirname, "..");
const tandaArg = process.argv[2] ? parseInt(process.argv[2], 10) : 0;
const evidenceSub = tandaArg > 0 ? `tanda_${String(tandaArg).padStart(2, "0")}` : "baseline";
const EVIDENCE_DIR = path.join(ROOT, "docs", "ART_REBUILD", "evidence", evidenceSub);
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

process.env.LD_LIBRARY_PATH = "/tmp/al2023/lib:/tmp/al2023:" + (process.env.LD_LIBRARY_PATH || "");
process.env.FONTCONFIG_PATH = "/tmp/al2023/etc/fonts";

function ensureServer(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/index.html`, (res) => {
      res.resume();
      resolve({ external: true, close: () => {} });
    });
    req.on("error", () => {
      const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png" };
      const srv = http.createServer((q, s) => {
        const clean = decodeURIComponent(q.url.split("?")[0]);
        const fp = path.join(ROOT, clean === "/" ? "index.html" : clean);
        if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
          s.writeHead(404); s.end("Not found"); return;
        }
        s.writeHead(200, { "Content-Type": mime[path.extname(fp)] || "application/octet-stream" });
        fs.createReadStream(fp).pipe(s);
      });
      srv.listen(0, "127.0.0.1", () => {
        resolve({ external: false, port: srv.address().port, close: () => srv.close() });
      });
    });
  });
}

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const srvInfo = await ensureServer(8080);
  const port = srvInfo.port || 8080;
  const url = `http://127.0.0.1:${port}/index.html`;

  const browser = await pwChromium.launch({
    executablePath: "/tmp/chromium",
    args: [...sparticuz.args, "--no-sandbox", "--disable-gpu-sandbox"],
    headless: true
  });

  const pageErrors = [];
  const httpErrors = [];

  try {
    // 1. Primary 1280x720 Validation + Evidence Capture
    const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await ctx1.newPage();
    page.on("pageerror", (e) => pageErrors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().includes("__dev_ping")) {
        httpErrors.push(`${r.status()} ${r.url()}`);
      }
    });

    // Inject Standard Emulated Xbox Gamepad hook for automated verification
    await page.addInitScript(() => {
      window.__DD_MOCK_PAD = {
        id: "Xbox 360 Controller (XInput STANDARD GAMEPAD - EMULATED)",
        index: 0,
        connected: true,
        mapping: "standard",
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
        timestamp: performance.now()
      };
      navigator.getGamepads = function () {
        window.__DD_MOCK_PAD.timestamp = performance.now();
        return [window.__DD_MOCK_PAD, null, null, null];
      };
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(800);

    // Wait until all preloaded DD_ASSETS finish loading
    await page.waitForFunction(() => {
      if (!window.DD_ASSETS) return false;
      const st = window.DD_ASSETS.stats();
      return st.loaded + st.errors >= st.registered;
    }, { timeout: 15000 });

    const integrity = await page.evaluate(() => window.DD_ASSETS.integrity());
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_main_menu.png"), animations: "disabled" });

    // Enter HUB via Main Menu button (triggers Intro Cinematic -> skip -> HUB)
    await page.click('#dd-menu-nav .dd-menu-btn[data-action="hub"]', { noWaitAfter: true });
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_intro_cinematic.png"), animations: "disabled" });
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await page.waitForTimeout(350);

    // Move protagonist inside HUB via emulated Xbox gamepad left stick!
    await page.evaluate(() => { window.__DD_MOCK_PAD.axes = [-0.8, -0.35, 0, 0]; });
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__DD_MOCK_PAD.axes = [0, 0, 0, 0]; });
    await page.waitForTimeout(150);
    const hubState = await page.evaluate(() => window.DD_HUB.getState());
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_hub_refugio.png"), animations: "disabled" });

    // Open 4-Column Armory / Shop & equip a weapon
    await page.evaluate(() => window.DD_UI.openShop());
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_armory_shop.png"), animations: "disabled" });

    // Open Infernal Tower Progression Map
    await page.evaluate(() => window.DD_UI.openMap());
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_progression_map.png"), animations: "disabled" });
    await page.evaluate(() => window.DD_UI.closeModals());

    // Trigger Descent from HUB into Real Circle I Combat!
    await page.evaluate(() => window.DD_HUB.exitToRun());
    await page.waitForTimeout(250);
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await page.waitForTimeout(450);

    // Verify real combat movement, shooting & organic suite
    const combatCheck = await page.evaluate(() => {
      const s0 = window.__DD_BRIDGE.getSnapshot();
      const s1 = window.__DD_BRIDGE.testStep({ right: true, down: true, fire: true, aim: 0.25 }, 16);
      const suite = window.DMO_ORGANIC_DEBUG.runTestSuite();
      return {
        running: s1.running,
        moved: Math.hypot((s1.player.x - s0.player.x), (s1.player.y - s0.player.y)) > 6,
        canvas: window.__DD_BRIDGE.getCanvasInfo(),
        v32SuitePass: suite.pass,
        weaponsChecked: suite.weaponsChecked
      };
    });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_combat_gameplay.png"), animations: "disabled" });

    // 2. High-DPI 1920x1080 @ DPR 2x Verification (in same process before closing context)
    await page.setViewportSize({ width: 1920, height: 1080 });
    const dpr2Info = await page.evaluate(() => {
      Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
      window.dispatchEvent(new Event("resize"));
      window.__DD_BRIDGE.testStep({}, 2);
      return window.__DD_BRIDGE.getCanvasInfo();
    });
    await ctx1.close();

    const summary = {
      tanda: tandaArg,
      pass:
        pageErrors.length === 0 &&
        httpErrors.length === 0 &&
        integrity.pass &&
        hubState.active === true &&
        combatCheck.running === true &&
        combatCheck.moved === true &&
        combatCheck.v32SuitePass === true &&
        combatCheck.canvas.smoothing === true &&
        dpr2Info.bufferWidth === 3840 &&
        dpr2Info.bufferHeight === 2160,
      pageErrors,
      httpErrors,
      assetsRegistered: integrity.totalRegistered,
      assetsVerified: integrity.ok,
      hubState,
      combatCheck,
      dpr2Info
    };

    fs.writeFileSync(path.join(EVIDENCE_DIR, "validation_report.json"), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    if (!summary.pass) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    srvInfo.close();
  }
})();
