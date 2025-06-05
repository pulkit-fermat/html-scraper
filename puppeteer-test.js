const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  console.log(typeof page.waitForTimeout); // Should print 'function'
  await browser.close();
})();