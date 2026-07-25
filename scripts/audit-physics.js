#!/usr/bin/env node
/* ============================================================
   audit-physics.js — 物理互動教材回歸稽核

   前置需求（僅開發時需要）：
     npm install --save-dev playwright
     npx playwright install chromium

   使用方式（於專案根目錄執行）：
     node scripts/audit-physics.js
     node scripts/audit-physics.js --write-report
     node scripts/audit-physics.js --online
     node scripts/audit-physics.js --online --write-report
     node scripts/audit-physics.js --online --site-url=https://example.com/site/

   預設模式不使用外網，會重跑 24 組公式驗算與 20 個可操作性案例。
   --online 會再從正式網站讀取 CDN 類物理案例，驗證程式庫載入、
   Canvas/WebGL 渲染、動畫影格變化、基本互動及 JavaScript 錯誤。
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("找不到 playwright，請先執行：");
  console.error("  npm install --save-dev playwright");
  console.error("  npx playwright install chromium");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SITE_URL = "https://prayer168.github.io/digital-learning-inspiration-site/";
const DATA_FILES = [
  "data-phase2", "data-phase2b", "data-phase2c",
  "data-phase3a", "data-phase3b", "data-phase3c", "data-phase3d",
  "data-phase4a", "data-phase4b", "data-phase4c", "data-phase4d", "data-phase4e",
  "data"
];

const OPERABILITY_IDS = [
  "js-001", "js-011", "sci-003", "sci-005", "sci-007",
  "sci-008", "sci-014", "sci-015", "td-009", "td-010",
  "lab-002", "lab-003", "lab-005", "lab-007", "lab-008",
  "lab-009", "lab-013", "cv-008", "phy-018", "phy-019"
];

const ONLINE_CASES = [
  {
    id: "p5-001", library: "p5.js",
    check: "粒子先向上噴出，之後受向下加速度影響而回落。"
  },
  {
    id: "p5-004", library: "p5.js",
    check: "粒子沿連續向量場移動；此案例為流場概念視覺化，不作定量流體驗算。"
  },
  {
    id: "p5-006", library: "p5.js",
    check: "球碰到畫布邊界後反向；目前程式只模擬邊界碰撞，不含球與球碰撞。"
  },
  {
    id: "p5-007", library: "p5.js",
    check: "點擊畫布後文字改為「發聲中」，圓形波動振幅明顯增加。"
  },
  {
    id: "mt-001", library: "Matter.js",
    check: "積木受重力落下、互相碰撞並在地面堆疊；可用滑鼠拖曳。"
  },
  {
    id: "mt-002", library: "Matter.js",
    check: "方塊受重力分量影響沿斜面向下滑動。"
  },
  {
    id: "mt-003", library: "Matter.js",
    check: "擺錘維持固定繩長往復擺動；拖曳後仍受約束。"
  },
  {
    id: "mt-004", library: "Matter.js",
    check: "球撞擊第一張骨牌後依序傳遞碰撞，形成連鎖倒下。"
  },
  {
    id: "mt-005", library: "Matter.js",
    check: "點擊畫布會新增球；球落地後反彈，反彈高度逐次降低。"
  },
  {
    id: "mt-006", library: "Matter.js",
    check: "重物落到橋面後，橋面鏈節受力下凹且兩端維持固定。"
  },
  {
    id: "mt-007", library: "Matter.js",
    check: "按「翻轉重力」後，球群的加速度方向上下反轉。"
  },
  {
    id: "th-005", library: "Three.js",
    check: "WebGL 波動平面持續改變高度，呈現相位隨時間推進的週期波紋。"
  }
];

const NUMERIC_SPECS = [
  {
    id: "js-001",
    law: "司乃耳定律 n₁·sinθ₁ = n₂·sinθ₂（n₁=1，n₂=1.33）",
    samples: [
      { input: "θ₁=30°", expected: "θ₂=22.1°", values: { angle: 30 }, expectedValue: 22.1, tolerance: 0.15 },
      { input: "θ₁=40°", expected: "θ₂=28.9°", values: { angle: 40 }, expectedValue: 28.9, tolerance: 0.15 },
      { input: "θ₁=60°", expected: "θ₂=40.6°", values: { angle: 60 }, expectedValue: 40.6, tolerance: 0.15 }
    ]
  },
  {
    id: "sci-005",
    law: "薄透鏡公式 1/f = 1/u + 1/v（f=50 px）",
    samples: [
      { input: "u=120", expected: "實像（倒立），像距約 86px", values: { u: 120 }, expectedText: "實像（倒立），像距約 86px" },
      { input: "u=80", expected: "實像（倒立），像距約 133px", values: { u: 80 }, expectedText: "實像（倒立），像距約 133px" },
      { input: "u=30", expected: "虛像（正立），像距約 75px", values: { u: 30 }, expectedText: "虛像（正立），像距約 75px" }
    ]
  },
  {
    id: "lab-005",
    law: "歐姆定律 I = V / R",
    samples: [
      { input: "6V / 3Ω", expected: "I=2.00 A", values: { v: 6, r: 3 }, expectedValue: 2, tolerance: 0.005 },
      { input: "12V / 4Ω", expected: "I=3.00 A", values: { v: 12, r: 4 }, expectedValue: 3, tolerance: 0.005 },
      { input: "9V / 9Ω", expected: "I=1.00 A", values: { v: 9, r: 9 }, expectedValue: 1, tolerance: 0.005 }
    ]
  },
  {
    id: "lab-008",
    law: "虎克定律 F = kx（k=0.5 N/cm）",
    samples: [
      { input: "F=2N", expected: "x=4cm", values: { w: 2 }, expectedValue: 4, tolerance: 0.01 },
      { input: "F=4N", expected: "x=8cm", values: { w: 4 }, expectedValue: 8, tolerance: 0.01 },
      { input: "F=6N", expected: "x=12cm", values: { w: 6 }, expectedValue: 12, tolerance: 0.01 }
    ]
  },
  {
    id: "lab-003",
    law: "槓桿平衡：左力矩（重×臂）= 右力矩（固定 3×3=9）",
    samples: [
      { input: "3×3=9", expected: "平衡！力矩相等 (9)", values: { lw: 3, ld: 3 }, expectedText: "平衡！力矩相等 (9)" },
      { input: "1×3=3", expected: "左力矩 3，右力矩 9", values: { lw: 1, ld: 3 }, expectedText: "左力矩 3，右力矩 9" },
      { input: "3×1=3", expected: "左力矩 3，右力矩 9", values: { lw: 3, ld: 1 }, expectedText: "左力矩 3，右力矩 9" }
    ]
  },
  {
    id: "sci-007",
    law: "氣壓 P = 1013·(1−2.25577×10⁻⁵·h)^5.2559 hPa",
    samples: [
      { input: "h=0m", expected: "1013 hPa", values: { alt: 0 }, expectedValue: 1013, tolerance: 0.01 },
      { input: "h=3000m", expected: "701 hPa", values: { alt: 3000 }, expectedValue: 701, tolerance: 0.01 },
      { input: "h=8000m", expected: "356 hPa", values: { alt: 8000 }, expectedValue: 356, tolerance: 0.01 }
    ]
  },
  {
    id: "sci-001",
    law: "月相相位：0°新月、90°上弦、180°滿月、270°下弦",
    samples: [
      { input: "0°", expected: "新月", values: { ph: 0 }, expectedText: "新月" },
      { input: "90°", expected: "上弦月", values: { ph: 90 }, expectedText: "上弦月" },
      { input: "180°", expected: "滿月", values: { ph: 180 }, expectedText: "滿月" },
      { input: "270°", expected: "下弦月", values: { ph: 270 }, expectedText: "下弦月" }
    ]
  },
  {
    id: "lab-002",
    law: "阿基米德浮沉判斷：密度小於水（1.0）上浮，大於水下沉",
    samples: [
      { input: "ρ=0.5", expected: "top=10px（上浮）", values: { dens: 0.5 }, expectedValue: 10, tolerance: 0.01 },
      { input: "ρ=1.5", expected: "top=130px（下沉）", values: { dens: 1.5 }, expectedValue: 130, tolerance: 0.01 }
    ]
  }
];

function parseArgs() {
  const args = process.argv.slice(2);
  const siteArg = args.find(function (arg) { return arg.indexOf("--site-url=") === 0; });
  return {
    online: args.indexOf("--online") !== -1,
    writeReport: args.indexOf("--write-report") !== -1,
    siteUrl: siteArg ? siteArg.slice("--site-url=".length) : DEFAULT_SITE_URL
  };
}

function loadExamples() {
  global.window = {};
  global.matchMedia = function () { return { matches: false }; };
  DATA_FILES.forEach(function (name) {
    const file = path.join(ROOT, "js", name + ".js");
    if (!fs.existsSync(file)) throw new Error("找不到資料檔：" + file);
    delete require.cache[require.resolve(file)];
    require(file);
  });
  return (global.window.DATA && global.window.DATA.examples) || [];
}

function buildFullHtml(example) {
  if (example.fullCode && example.fullCode.trim()) return example.fullCode;
  return [
    "<!DOCTYPE html>",
    '<html lang="zh-Hant"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "<style>" + (example.cssCode || "") + "</style></head><body>",
    example.htmlCode || "",
    "<scr" + "ipt>" + (example.jsCode || "") + "</scr" + "ipt>",
    "</body></html>"
  ].join("\n");
}

function indexById(examples) {
  const result = {};
  examples.forEach(function (example) { result[example.id] = example; });
  return result;
}

async function setControlValues(page, values) {
  await page.evaluate(function (nextValues) {
    Object.keys(nextValues).forEach(function (id) {
      const element = document.getElementById(id);
      if (!element) throw new Error("找不到控制項 #" + id);
      element.value = String(nextValues[id]);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, values);
}

async function measureNumericCase(page, id) {
  switch (id) {
    case "js-001":
      return page.evaluate(function () {
        const line = document.getElementById("refract");
        const dx = Number(line.getAttribute("x2")) - Number(line.getAttribute("x1"));
        const dy = Number(line.getAttribute("y2")) - Number(line.getAttribute("y1"));
        const angle = Math.atan2(dx, dy) * 180 / Math.PI;
        return { value: angle, label: "θ₂=" + angle.toFixed(1) + "°" };
      });
    case "sci-005":
      return page.evaluate(function () {
        const text = document.getElementById("info").textContent.trim();
        return { text: text, label: text };
      });
    case "lab-005":
      return page.evaluate(function () {
        const value = Number(document.getElementById("i").textContent);
        return { value: value, label: "I=" + value.toFixed(2) + " A" };
      });
    case "lab-008":
      return page.evaluate(function () {
        const value = Number(document.getElementById("x").textContent);
        return { value: value, label: "x=" + value + "cm" };
      });
    case "lab-003":
      return page.evaluate(function () {
        const text = document.getElementById("state").textContent.trim();
        return { text: text, label: text };
      });
    case "sci-007":
      return page.evaluate(function () {
        const value = Number(document.getElementById("pr").textContent);
        return { value: value, label: value + " hPa" };
      });
    case "sci-001":
      return page.evaluate(function () {
        const text = document.getElementById("name").textContent.replace(/^月相：/, "").trim();
        return { text: text, label: text };
      });
    case "lab-002":
      return page.evaluate(function () {
        const value = parseFloat(document.getElementById("obj").style.top);
        return { value: value, label: "top=" + value + "px" };
      });
    default:
      throw new Error("未定義數值量測：" + id);
  }
}

function samplePassed(sample, measured) {
  if (typeof sample.expectedValue === "number") {
    return Math.abs(measured.value - sample.expectedValue) <= (sample.tolerance || 0);
  }
  return measured.text === sample.expectedText;
}

function captureRuntimeErrors(page, errors) {
  page.on("pageerror", function (error) {
    errors.push(error.message);
  });
  page.on("console", function (message) {
    if (message.type() === "error") {
      errors.push("console.error: " + message.text());
    }
  });
}

async function runNumericAudits(browser, examplesById) {
  const groups = [];
  for (const spec of NUMERIC_SPECS) {
    const example = examplesById[spec.id];
    if (!example) throw new Error("找不到數值稽核案例：" + spec.id);
    const page = await browser.newPage({ viewport: { width: 420, height: 320 } });
    const errors = [];
    captureRuntimeErrors(page, errors);
    const rows = [];
    try {
      await page.setContent(buildFullHtml(example), { waitUntil: "load", timeout: 15000 });
      for (const sample of spec.samples) {
        await setControlValues(page, sample.values);
        const measured = await measureNumericCase(page, spec.id);
        rows.push({
          input: sample.input,
          expected: sample.expected,
          actual: measured.label,
          passed: samplePassed(sample, measured) && errors.length === 0
        });
      }
    } catch (error) {
      rows.push({
        input: "執行",
        expected: "正常完成",
        actual: error.message,
        passed: false
      });
    } finally {
      await page.close();
    }
    groups.push({
      id: spec.id,
      title: example.title,
      law: spec.law,
      rows: rows
    });
  }
  return groups;
}

async function interactWithCommonControls(page) {
  const rangeCount = await page.locator('input[type="range"]').count();
  for (let index = 0; index < rangeCount; index += 1) {
    const range = page.locator('input[type="range"]').nth(index);
    await range.evaluate(function (element) {
      const min = Number(element.min || 0);
      const max = Number(element.max || 100);
      element.value = String(min + (max - min) * 0.7);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  const buttonCount = Math.min(await page.locator("button").count(), 8);
  for (let index = 0; index < buttonCount; index += 1) {
    const button = page.locator("button").nth(index);
    if (await button.isVisible()) await button.click({ timeout: 2000 });
  }

  const canvas = page.locator("canvas").first();
  if (await canvas.count() && await canvas.isVisible()) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.55, { steps: 4 });
      await page.mouse.up();
      await canvas.click({ position: { x: Math.max(1, box.width * 0.5), y: Math.max(1, box.height * 0.4) } });
    }
  }
}

async function runOperabilityAudits(browser, examplesById) {
  const results = [];
  for (const id of OPERABILITY_IDS) {
    const example = examplesById[id];
    if (!example) {
      results.push({ id: id, title: "找不到案例", passed: false, note: "資料庫沒有此 id" });
      continue;
    }
    const page = await browser.newPage({ viewport: { width: 420, height: 320 } });
    const errors = [];
    captureRuntimeErrors(page, errors);
    try {
      await page.setContent(buildFullHtml(example), { waitUntil: "load", timeout: 15000 });
      await page.waitForTimeout(80);
      await interactWithCommonControls(page);
      await page.waitForTimeout(120);
      const hasContent = await page.evaluate(function () {
        return document.body.children.length > 0 && document.body.innerHTML.trim().length > 0;
      });
      results.push({
        id: id,
        title: example.title,
        passed: hasContent && errors.length === 0,
        note: errors.length ? errors.join("；") : "渲染正常、操作無錯誤"
      });
    } catch (error) {
      results.push({ id: id, title: example.title, passed: false, note: error.message });
    } finally {
      await page.close();
    }
  }
  return results;
}

function normalizeSiteUrl(value) {
  return value.endsWith("/") ? value : value + "/";
}

async function readPublishedOnlineCases(browser, siteUrl) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(normalizeSiteUrl(siteUrl) + "?physics-audit=" + Date.now(), {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    await page.waitForFunction(function () {
      return window.DATA && Array.isArray(window.DATA.examples) && window.DATA.examples.length > 0;
    }, null, { timeout: 30000 });
    return await page.evaluate(function (ids) {
      return ids.map(function (id) {
        const item = window.DATA.examples.find(function (example) { return example.id === id; });
        if (!item) return null;
        return {
          id: item.id,
          title: item.title,
          fullCode: item.fullCode || "",
          libraries: item.libraries || []
        };
      });
    }, ONLINE_CASES.map(function (item) { return item.id; }));
  } finally {
    await page.close();
  }
}

async function runOnlineAudits(browser, siteUrl) {
  const published = await readPublishedOnlineCases(browser, siteUrl);
  const byId = indexById(published.filter(Boolean));
  const results = [];

  for (const spec of ONLINE_CASES) {
    const example = byId[spec.id];
    if (!example || !example.fullCode.trim()) {
      results.push({
        id: spec.id,
        title: example ? example.title : "找不到案例",
        library: spec.library,
        passed: false,
        note: example ? "線上案例沒有完整程式碼" : "線上網站找不到此 id"
      });
      continue;
    }

    const page = await browser.newPage({ viewport: { width: 420, height: 320 } });
    const errors = [];
    captureRuntimeErrors(page, errors);
    try {
      if (spec.id === "p5-007") {
        await page.evaluate(function () {
          const NativeAudioContext = window.AudioContext;
          window.__auditAudioStarted = 0;
          window.AudioContext = function () {
            const context = new NativeAudioContext();
            const nativeCreateOscillator = context.createOscillator.bind(context);
            context.createOscillator = function () {
              const oscillator = nativeCreateOscillator();
              const nativeStart = oscillator.start.bind(oscillator);
              oscillator.start = function () {
                window.__auditAudioStarted += 1;
                return nativeStart.apply(oscillator, arguments);
              };
              return oscillator;
            };
            return context;
          };
          window.AudioContext.prototype = NativeAudioContext.prototype;
        });
      }
      await page.setContent(example.fullCode, { waitUntil: "load", timeout: 30000 });
      const globalName = spec.library === "p5.js" ? "p5" :
        spec.library === "Matter.js" ? "Matter" : "THREE";
      await page.waitForFunction(function (name) {
        return typeof window[name] !== "undefined";
      }, globalName, { timeout: 20000 });
      const canvas = page.locator("canvas").first();
      await canvas.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForTimeout(220);
      const before = await canvas.screenshot();

      if (spec.id === "p5-007" || spec.id === "mt-005") {
        await canvas.click({ position: { x: 120, y: 80 } });
      } else if (spec.id === "mt-007") {
        await page.locator("#flip").click();
      } else if (["mt-001", "mt-003"].indexOf(spec.id) !== -1) {
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.45);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.3, { steps: 5 });
          await page.mouse.up();
        }
      }

      await page.waitForTimeout(520);
      const after = await canvas.screenshot();
      const fallbackVisible = await page.evaluate(function () {
        const fallback = document.getElementById("fb") || document.getElementById("fallback");
        return fallback ? getComputedStyle(fallback).display !== "none" : false;
      });
      let interactionPassed = true;
      if (spec.id === "p5-007") {
        interactionPassed = await page.evaluate(function () {
          return window.__auditAudioStarted > 0;
        });
      }
      results.push({
        id: spec.id,
        title: example.title,
        library: spec.library,
        passed: !before.equals(after) && !fallbackVisible && interactionPassed && errors.length === 0,
        note: errors.length ? errors.join("；") :
          (before.equals(after) ? "畫面影格未變化" :
            (fallbackVisible ? "顯示程式庫載入失敗提示" :
              (!interactionPassed ? "互動狀態未更新" : "CDN 載入、渲染與互動正常")))
      });
    } catch (error) {
      results.push({
        id: spec.id,
        title: example.title,
        library: spec.library,
        passed: false,
        note: error.message
      });
    } finally {
      await page.close();
    }
  }
  return results;
}

function countNumericRows(groups) {
  return groups.reduce(function (sum, group) { return sum + group.rows.length; }, 0);
}

function countNumericPasses(groups) {
  return groups.reduce(function (sum, group) {
    return sum + group.rows.filter(function (row) { return row.passed; }).length;
  }, 0);
}

function mark(value) {
  return value ? "✅" : "❌";
}

function escapeTable(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function buildReport(numericGroups, operability, online, options) {
  const numericTotal = countNumericRows(numericGroups);
  const numericPassed = countNumericPasses(numericGroups);
  const operationPassed = operability.filter(function (row) { return row.passed; }).length;
  const lines = [
    "# 物理互動教材稽核報告（AUDIT）",
    "",
    "- 產生時間：" + new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC"),
    "- 稽核腳本：`node scripts/audit-physics.js" + (options.online ? " --online" : "") + " --write-report`",
    "- 數值準確性：**" + numericPassed + "/" + numericTotal + " 通過**；可操作性：**" +
      operationPassed + "/" + operability.length + " 通過**。",
    "",
    "> 本機稽核以無頭 Chromium 載入每個教材的完整程式碼、操作控制項並讀取輸出，再以獨立期望值比對。",
    "> CDN 類測試只驗證線上載入、渲染、動畫與基本互動；物理現象合理性仍須依 `docs/cdn-physics-online-checklist.md` 人工確認。",
    "",
    "## 一、數值準確性（對照物理公式）",
    ""
  ];

  numericGroups.forEach(function (group) {
    const passed = group.rows.every(function (row) { return row.passed; });
    lines.push("### " + mark(passed) + " " + group.id + " — " + group.title);
    lines.push("");
    lines.push("**物理定律**：" + group.law);
    lines.push("");
    lines.push("| 輸入 | 預期 | 實測 | 結果 |");
    lines.push("| --- | --- | --- | --- |");
    group.rows.forEach(function (row) {
      lines.push("| " + escapeTable(row.input) + " | " + escapeTable(row.expected) + " | " +
        escapeTable(row.actual) + " | " + mark(row.passed) + " |");
    });
    lines.push("");
  });

  lines.push("## 二、可操作性（渲染與互動）");
  lines.push("");
  lines.push("| 案例 | 標題 | 結果 | 備註 |");
  lines.push("| --- | --- | --- | --- |");
  operability.forEach(function (row) {
    lines.push("| " + row.id + " | " + escapeTable(row.title) + " | " + mark(row.passed) +
      " | " + escapeTable(row.note) + " |");
  });
  lines.push("");
  lines.push("## 三、CDN 類物理模擬線上煙霧測試");
  lines.push("");

  if (online) {
    const onlinePassed = online.filter(function (row) { return row.passed; }).length;
    lines.push("- 測試網站：" + options.siteUrl);
    lines.push("- 自動煙霧測試：**" + onlinePassed + "/" + online.length + " 通過**。");
    lines.push("");
    lines.push("| 案例 | 程式庫 | 標題 | 結果 | 備註 |");
    lines.push("| --- | --- | --- | --- | --- |");
    online.forEach(function (row) {
      lines.push("| " + row.id + " | " + row.library + " | " + escapeTable(row.title) + " | " +
        mark(row.passed) + " | " + escapeTable(row.note) + " |");
    });
  } else {
    lines.push("- 本次未執行外網測試；可使用 `node scripts/audit-physics.js --online` 重跑。");
    lines.push("- 人工判讀步驟與預期現象見 `docs/cdn-physics-online-checklist.md`。");
  }

  lines.push("");
  lines.push("## 四、範圍與限制");
  lines.push("");
  lines.push("- 概念型（無完整程式碼）條目不納入可執行測試。`phy-026 電容充放電` 屬於此類。");
  lines.push("- 目前沒有以 GSAP 製作且資料欄位標示為「物理」的完整程式碼案例。");
  lines.push("- p5.js 流場與 Three.js 波動平面屬概念視覺化；自動測試不宣稱其為定量物理模型。");
  lines.push("- CDN 測試受網路、瀏覽器自動播放政策、WebGL 與第三方服務狀態影響。");
  lines.push("");
  lines.push("## 五、結論");
  lines.push("");
  lines.push("- 數值稽核以教材畫面實測值對照獨立期望值；任一差異超出容忍範圍時腳本會以非 0 狀態結束。");
  lines.push("- 可操作性稽核會操作範圍輸入、按鈕及 Canvas，並攔截未處理的 JavaScript 錯誤。");
  lines.push("- CDN 自動測試通過後，仍應完成線上驗證清單的教學合理性人工判讀。");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const options = parseArgs();
  options.siteUrl = normalizeSiteUrl(options.siteUrl);
  const examples = loadExamples();
  const examplesById = indexById(examples);
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {}
  );

  let numericGroups;
  let operability;
  let online = null;
  try {
    numericGroups = await runNumericAudits(browser, examplesById);
    operability = await runOperabilityAudits(browser, examplesById);
    if (options.online) online = await runOnlineAudits(browser, options.siteUrl);
  } finally {
    await browser.close();
  }

  const numericTotal = countNumericRows(numericGroups);
  const numericPassed = countNumericPasses(numericGroups);
  const operationPassed = operability.filter(function (row) { return row.passed; }).length;
  const onlinePassed = online ? online.filter(function (row) { return row.passed; }).length : null;

  console.log("數值準確性：" + numericPassed + "/" + numericTotal);
  console.log("可操作性：" + operationPassed + "/" + operability.length);
  if (online) console.log("CDN 線上煙霧測試：" + onlinePassed + "/" + online.length);

  const report = buildReport(numericGroups, operability, online, options);
  if (options.writeReport) {
    const output = path.join(ROOT, "AUDIT.md");
    fs.writeFileSync(output, report, "utf8");
    console.log("已更新：" + path.relative(ROOT, output));
  }

  const failed = numericPassed !== numericTotal ||
    operationPassed !== operability.length ||
    (online && onlinePassed !== online.length);
  if (failed) {
    console.error("稽核未全部通過；請查看上方結果或以 --write-report 產生詳細報告。");
    process.exit(1);
  }
}

main().catch(function (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
