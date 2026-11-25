#!/usr/bin/env node
/**
 * Kiểm màn đầu trang chủ trên mobile 390×844 (TASK_CHONSO_HOME_MOBILE_Q7_20261124).
 *
 *   node scripts/check-home-mobile.mjs [baseUrl] [screenshotPath]
 *   baseUrl mặc định http://localhost:3000, ảnh mặc định /tmp/cs_home_after.png
 *
 * Đạt khi, ngay lúc tải trang (không cuộn):
 *   - ≥ 2 thẻ SIM có cả số lẫn giá nằm trọn trong viewport và ở trên mép `top`
 *     của thanh sticky Gọi/Zalo (#sticky-cta-bottom);
 *   - link /diem-giao-dich-mobifone-quan-7 nằm trọn trong vùng đó.
 *
 * Playwright không nằm trong dependencies của repo: script thử `import("playwright")`
 * rồi mới tới đường dẫn trong biến môi trường PLAYWRIGHT_MODULE.
 */

const MIN_FULL_CARDS = 2;
const Q7_HREF = "/diem-giao-dich-mobifone-quan-7";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (err) {
    const alt = process.env.PLAYWRIGHT_MODULE;
    if (alt) return await import(alt);
    throw new Error(
      "Không tìm thấy playwright. Cài tạm (npm i --no-save playwright) hoặc đặt PLAYWRIGHT_MODULE=/đường/dẫn/playwright/index.mjs",
      { cause: err },
    );
  }
}

const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
const shotPath = process.argv[3] || "/tmp/cs_home_after.png";
const url = `${baseUrl}/?noibo=1`;

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await context.newPage();

let exitCode = 1;
try {
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page.waitForSelector(".sim-card-compact", { timeout: 30_000 });
  // Thanh sticky chỉ render sau khi hydrate (useIsMobile) — chờ nó, nếu không có
  // thì coi đáy viewport là mép che.
  await page.waitForSelector("#sticky-cta-bottom", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800); // để font/ảnh ổn định layout
  await page.evaluate(() => window.scrollTo(0, 0));

  const result = await page.evaluate((q7Href) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bar = document.getElementById("sticky-cta-bottom");
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const coverTop = barRect && barRect.height > 0 ? barRect.top : vh;

    const inside = (r) => r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.right <= vw && r.bottom <= coverTop;
    const round = (r) => ({ top: Math.round(r.top), bottom: Math.round(r.bottom) });

    const cards = [...document.querySelectorAll(".sim-card-compact")];
    const details = cards.slice(0, 8).map((card) => {
      const numberEl = card.querySelector("a.sim-number-auto");
      // Giá: span in đậm đầu tiên có đuôi "đ" (không lấy giá gạch ngang).
      const priceEl = [...card.querySelectorAll("span")].find(
        (s) => !s.className.includes("line-through") && /\d[\d.,]*\s*(đ|₫)\s*$/i.test(s.textContent.trim()) && s.children.length === 0,
      );
      const nRect = numberEl?.getBoundingClientRect();
      const pRect = priceEl?.getBoundingClientRect();
      const numberFull = !!numberEl && inside(nRect) && numberEl.scrollWidth <= numberEl.clientWidth + 1;
      const priceFull = !!priceEl && inside(pRect);
      return {
        number: numberEl?.textContent.trim() ?? null,
        price: priceEl?.textContent.trim() ?? null,
        numberRect: nRect ? round(nRect) : null,
        priceRect: pRect ? round(pRect) : null,
        full: numberFull && priceFull,
      };
    });

    const q7 = document.querySelector(`main a[href="${q7Href}"]`);
    const q7Rect = q7?.getBoundingClientRect();
    return {
      viewport: { vw, vh },
      stickyBar: barRect ? { top: Math.round(barRect.top), height: Math.round(barRect.height) } : null,
      coverTop: Math.round(coverTop),
      fullCards: details.filter((d) => d.full).length,
      cards: details,
      q7: q7
        ? { text: q7.textContent.trim(), rect: round(q7Rect), onFirstScreen: inside(q7Rect) }
        : null,
    };
  }, Q7_HREF);

  await page.screenshot({ path: shotPath });

  const cardsOk = result.fullCards >= MIN_FULL_CARDS;
  const q7Ok = !!result.q7?.onFirstScreen;
  console.log(JSON.stringify({ url, screenshot: shotPath, ...result }, null, 2));
  console.log(
    `\n${cardsOk ? "PASS" : "FAIL"}  thẻ SIM thấy trọn số + giá (trên sticky bar): ${result.fullCards} (cần ≥ ${MIN_FULL_CARDS})`,
  );
  console.log(`${q7Ok ? "PASS" : "FAIL"}  link Q7 trên màn đầu: ${result.q7 ? result.q7.text : "không có"}`);
  exitCode = cardsOk && q7Ok ? 0 : 1;
} catch (err) {
  console.error(err);
  exitCode = 2;
} finally {
  await browser.close();
}
process.exit(exitCode);
