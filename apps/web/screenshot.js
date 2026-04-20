const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  
  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'streamx_desktop.png' });
  await page.close();

  // Mobile
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await mobilePage.screenshot({ path: 'streamx_mobile.png' });
  
  // Mobile - open sidebar
  await mobilePage.click('button:has(svg.lucide-menu)');
  await new Promise(r => setTimeout(r, 500)); // wait for animation
  await mobilePage.screenshot({ path: 'streamx_mobile_sidebar.png' });

  await browser.close();
  console.log('Screenshots captured: streamx_desktop.png, streamx_mobile.png, streamx_mobile_sidebar.png');
})();
