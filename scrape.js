const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).send('❌ Invalid URL provided');
    }

    const validUrl = url.startsWith('http') ? url : `http://${url}`;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(validUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const html = await page.content();
    const filePath = path.join(__dirname, 'rendered-page.html');
    fs.writeFileSync(filePath, html);

    await browser.close();

    // Return download link
    res.send(`https://a09b-2406-7400-56-a83d-88d-fcfb-62e2-4cb8.ngrok-free.app/download`);
  } catch (err) {
    console.error('❌ Scraping/Upload error:', err);
    res.status(500).send('❌ Error during scraping');
  }
});

app.get('/download', (req, res) => {
  const filePath = path.join(__dirname, 'rendered-page.html');
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('❌ File not found');
  }
});

app.listen(PORT, () => {
  console.log(`🟢 Web app running at http://localhost:${PORT}`);
});
