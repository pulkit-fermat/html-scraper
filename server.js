const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

async function getBrowser() {
  let options = { headless: 'new' };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return puppeteer.launch(options);
}

app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    const html = await page.content();
    await browser.close();

    const result = {
      facebook: extractFacebookPixel(html),
      ga4: extractGA4(html),
      tiktok: detect(html, 'ttq(', 'tiktok.com/i18n/pixel') ? 'Yes' : '',
      northbeam: detect(html, 'northbeam.io') ? 'Yes' : '',
      triplewhale: detect(html, 'triplewhale') ? 'Yes' : '',
      blotout: detect(html, 'blotout.io') ? 'Yes' : '',
      elevar: detect(html, 'elevar.js') ? 'Yes' : '',
      converge: detect(html, 'converge') ? 'Yes' : ''
    };

    res.json(result);
  } catch (err) {
    console.error('Scraping error:', err.message);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

function extractFacebookPixel(html) {
  const patterns = [
    /fbq\(['"]init['"],\s*['"](\d{10,20})['"]\)/g,
    /facebook\.com\/tr\?id=(\d{10,20})/g,
    /src=["']https:\/\/connect\.facebook\.net\/signals\/config\/(\d{10,20})/g,
    /signals\/config\/(\d{10,20})/g,
    /config\/(\d{10,20})/g,
    /data-pixel-id=["'](\d{10,20})["']/g,
    /"pixel_id"[:=]["']?(\d{10,20})["']?/g // JSON or JS assignment
  ];

  const ids = new Set();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      ids.add(match[1]);
    }
  }
  return Array.from(ids).join(', ');
}

function extractGA4(html) {
  const regex = /G-[A-Z0-9]{8,}/;
  const match = html.match(regex);
  return match ? match[0] : '';
}

function detect(html, ...terms) {
  return terms.some(term => html.includes(term));
}

app.listen(PORT, () => {
  console.log(`🟢 Web app running at http://localhost:${PORT}`);
});