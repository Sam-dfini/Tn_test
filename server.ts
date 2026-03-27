import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Agent that ignores SSL errors for problematic institutional sites
const insecureAgent = new https.Agent({
  rejectUnauthorized: false
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // RSS Proxy API
  app.get('/api/rss', async (req, res) => {
    const feedUrl = req.query.url as string;

    if (!feedUrl) {
      return res.status(400).json({ error: 'url param required' });
    }

    const ALLOWED_DOMAINS = [
      'nawaat.org',
      'inkyfada.com',
      'businessnews.com.tn',
      'kapitalis.com',
      'tap.info.tn',
      'reuters.com',
      'feeds.reuters.com',
      'mosaiquefm.net',
      'shemsfm.net',
      'leaders.com.tn',
      'webmanagercenter.com',
      'huffpostmaghreb.com',
      'jeuneafrique.com',
      'middleeasteye.net',
      'france24.com',
      'tafneed.org',
      'africanmanager.com',
      'realites.com.tn',
      'gnet.tn',
    ];

    try {
      const parsedFeedUrl = new URL(feedUrl);
      const isAllowed = ALLOWED_DOMAINS.some(domain =>
        parsedFeedUrl.hostname.includes(domain)
      );

      if (!isAllowed) {
        return res.status(403).json({ error: 'Domain not in allowlist' });
      }

      // Use insecure agent for Tunisian institutional sites which often have certificate chain issues
      const problematicDomains = ['tap.info.tn', 'inkyfada.com', 'nawaat.org', 'businessnews.com.tn', 'kapitalis.com', 'reuters.com', 'feeds.reuters.com', 'france24.com', 'tafneed.org', 'africanmanager.com', 'realites.com.tn', 'gnet.tn'];
      const useInsecure = problematicDomains.some(d => parsedFeedUrl.hostname.includes(d));

      console.log(`Proxying RSS fetch for: ${feedUrl} (Insecure: ${useInsecure})`);

      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/atom+xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ar;q=0.7',
          'Cache-Control': 'no-cache',
        },
        agent: useInsecure ? insecureAgent : undefined,
        timeout: 15000, // Increased to 15s
        follow: 5, // Follow up to 5 redirects
      });

      if (!response.ok) {
        console.error(`Fetch failed for ${feedUrl}: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: `Fetch failed with status ${response.status}`,
          statusText: response.statusText
        });
      }

      const xml = await response.text();
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(xml);
    } catch (error) {
      console.error('RSS Proxy Error:', error);
      res.status(500).json({ error: 'Fetch failed', details: String(error) });
    }
  });

  // Generic Proxy API
  app.get('/api/proxy', async (req, res) => {
    const target = req.query.url as string;

    if (!target) {
      return res.status(400).send('url param required');
    }

    const ALLOWED_APIS = [
      'api.exchangerate-api.com',
      'api.worldbank.org',
      'dataservices.imf.org',
      'www.imf.org',
      'api.tradingeconomics.com',
    ];

    try {
      const parsedTarget = new URL(target);
      const isAllowed = ALLOWED_APIS.some(domain =>
        parsedTarget.hostname.includes(domain)
      );

      if (!isAllowed) {
        return res.status(403).send('Not allowed');
      }

      const response = await fetch(target);
      const data = await response.text();

      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(data);
    } catch (error) {
      console.error('Proxy Error:', error);
      res.status(500).send(String(error));
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
