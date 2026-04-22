import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import https from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import 'dotenv/config';
import { runSatelliteIngestion, getLatestAgriReadings } from './src/pipeline/satellite/satelliteIngestion.js';
import { createClient } from '@supabase/supabase-js';
import { initializeAllSchemas } from './src/utils/schemaValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { spawn } from 'child_process';

// Initialize Gemini API
if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not defined in the environment.');
  console.log('Available env keys:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY') || k.includes('GEMINI')));
} else {
  console.log('GEMINI_API_KEY is defined. Length:', process.env.GEMINI_API_KEY.length);
  if (process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY')) {
    console.error('ERROR: GEMINI_API_KEY contains placeholder value "MY_GEMINI_API_KEY".');
  }
}

const genAI = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY') 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

// Start the Python FastAPI backend on port 8000
async function startPythonBackend() {
  console.log('Waiting 10 seconds for schema synchronization to complete...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log('Starting Python backend intelligence engine...');
  const pythonProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: path.join(__dirname, 'backend') }
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend:', err);
  });

  pythonProcess.on('exit', (code) => {
    console.log(`Python backend exited with code ${code}`);
    if (code !== 0) {
      console.log('Restarting Python backend in 5 seconds...');
      setTimeout(startPythonBackend, 5000);
    }
  });
  
  return pythonProcess;
}

// Start backend immediately
if (process.env.CORE_NODE_ENV !== 'production') {
  startPythonBackend();
}

// Agent that ignores SSL errors for problematic institutional sites
const insecureHttpsAgent = new https.Agent({
  rejectUnauthorized: false
});

import http from 'http';
const insecureHttpAgent = new http.Agent({
  keepAlive: true
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Safe Supabase initialization
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  
  let supabaseServer: any = null;
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseServer = createClient(supabaseUrl, supabaseKey);
      console.log('[Supabase] Server-side client initialized with URL:', supabaseUrl);
      
      // Self-healing: Initialize and fix schemas on startup
      initializeAllSchemas(supabaseServer).catch(err => {
        console.error('[Supabase] Schema initialization failed:', err);
      });
    } catch (err) {
      console.error('[Supabase] Failed to initialize client:', err);
    }
  } else {
    console.error('[Supabase] URL or KEY missing! Please check your .env file.');
  }

  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  // Live Intelligence Streaming Simulation
  io.on('connection', (socket) => {
    console.log('Client connected to Live Intelligence Stream');
    
    // Simulate live events coming from the "Backend Orchestrator"
    const interval = setInterval(() => {
      const events = ['ANOMALY_DETECTED', 'SIGNAL_EXTRACTED', 'RRI_UPDATED'];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      if (randomEvent === 'ANOMALY_DETECTED') {
        socket.emit('intel_event', {
          type: 'ANOMALY_DETECTED',
          payload: {
            variable_code: 'social.protest_events',
            is_anomaly: true,
            deviation: 2.4,
            message: 'Unusual spike in protest mentions detected in Gafsa.'
          },
          timestamp: new Date().toISOString()
        });
      } else if (randomEvent === 'RRI_UPDATED') {
        socket.emit('intel_event', {
          type: 'RRI_UPDATED',
          payload: {
            rri: 0.64 + (Math.random() * 0.05 - 0.02),
            previous_rri: 0.64
          },
          timestamp: new Date().toISOString()
        });
      }
    }, 15000);

    socket.on('disconnect', () => {
      clearInterval(interval);
      console.log('Client disconnected');
    });
  });

  // ── AgriIntel Satellite Pipeline routes ────────────────────────
  
  // GET /api/agri/latest — get most recent readings from Supabase
  app.get('/api/agri/latest', async (req, res) => {
    if (!supabaseServer) return res.status(503).json({ success: false, error: 'Database unavailable' });
    try {
      const readings = await getLatestAgriReadings(supabaseServer);
      res.json({ success: true, data: readings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/agri/sync — trigger a full satellite ingestion run
  app.post('/api/agri/sync', async (req, res) => {
    try {
      const result = await runSatelliteIngestion(supabaseServer, io, {
        force_refresh: req.body?.force_refresh ?? false,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1. Specific API routes (defined before the general proxy)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      key_exists: !!process.env.GEMINI_API_KEY, 
      key_is_placeholder: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY') : false 
    });
  });

  // Intelligence Variables Endpoint (Node implementation fallback)
  app.get('/api/variables', (req, res) => {
    try {
      const dataPath = path.join(__dirname, 'backend', 'app', 'data', 'rri_variables.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(raw);
        return res.json(data.variables || []);
      }
      res.status(404).json({ error: 'Variables data not found' });
    } catch (error) {
      console.error('Error serving variables:', error);
      res.status(500).json({ error: 'Internal server error serving variables' });
    }
  });

  // AI Proxy Endpoint
  app.post('/api/ai', async (req, res) => {
    console.log('Received request to /api/ai');
    if (!genAI) {
      const isPlaceholder = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY');
      if (isPlaceholder) {
        console.warn('AI Proxy Warning: GEMINI_API_KEY is a placeholder. Returning simulated response.');
      } else {
        console.error('AI Proxy Error: GEMINI_API_KEY environment variable is not defined.');
      }
      // Return a graceful 200 mock response so the UI doesn't crash from an unhandled error
      return res.status(200).json({ 
        text: `[SYSTEM DIAGNOSTIC: AI engine is offline. ${isPlaceholder ? 'Placeholder API key detected.' : 'Missing API key.'} Please provide a valid GEMINI_API_KEY in Settings.]`
      });
    }

    const { prompt, config } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const model = genAI.getGenerativeModel({ 
        model: config?.model || 'gemini-1.5-flash',
        generationConfig: {
          temperature: config?.temperature ?? 0.1,
          topP: config?.topP ?? 0.8,
          topK: config?.topK ?? 40,
          responseMimeType: config?.responseMimeType || 'text/plain',
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({ text });
    } catch (error: any) {
      console.error('AI Proxy Error:', error);
      res.status(400).json({ 
        error: 'AI Generation Failed', 
        message: error.message,
        details: error.toString()
      });
    }
  });

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
      'theguardian.com',
      'al-monitor.com',
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
      'google.com',
      'news.google.com',
      'tunisienumerique.com',
      'babnet.net',
      'www.babnet.net',
      'tunisia-sat.com',
      'bct.gov.tn',
      'imf.org',
      'worldbank.org',
      'hrw.org',
      'amnesty.org',
      'rfi.fr',
      'aljazeera.net',
      'jawharafm.net',
      'leconomistemaghrebin.com',
      'espacemanager.com',
      'kapitalis.com',
      'alkatiba.com',
      'ilboursa.com',
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
      const problematicDomains = [
        'tap.info.tn', 'inkyfada.com', 'nawaat.org', 'businessnews.com.tn', 
        'kapitalis.com', 'reuters.com', 'france24.com', 'tafneed.org', 
        'africanmanager.com', 'realites.com.tn', 'gnet.tn', 'middleeasteye.net',
        'jeuneafrique.com', 'aljazeera.net', 'jawharafm.net', 'leconomistemaghrebin.com',
        'espacemanager.com', 'tunisienumerique.com', 'alkatiba.com', 'babnet.net',
        'ilboursa.com'
      ];
      const useInsecure = problematicDomains.some(d => parsedFeedUrl.hostname.includes(d));

      console.log(`Proxying RSS fetch for: ${feedUrl} (Insecure: ${useInsecure})`);

      const fetchWithRetry = async (url: string, options: any, retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            return await fetch(url, options);
          } catch (err) {
            if (i === retries) throw err;
            console.warn(`Retry ${i + 1} for ${url} due to ${err}`);
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        throw new Error('Max retries reached');
      };

      const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      ];
      const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

      const response = await fetchWithRetry(feedUrl, {
        headers: {
          'User-Agent': randomUA,
          'Accept': 'application/rss+xml, application/atom+xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ar;q=0.7',
          'Cache-Control': 'no-cache',
        },
        agent: (parsedUrl: URL) => {
          if (!useInsecure) return undefined;
          return parsedUrl.protocol === 'https:' ? insecureHttpsAgent : insecureHttpAgent;
        },
        timeout: 60000, // Increased to 60s
        follow: 10, // Follow more redirects
      });

      if (!response.ok) {
        // If it's a 403 or 503, maybe the site is blocking the proxy
        if (response.status === 403 || response.status === 503 || response.status === 429) {
          console.warn(`Site ${parsedFeedUrl.hostname} is potentially blocking the proxy (Status: ${response.status})`);
        }
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
      'bct.gov.tn',
      'ins.tn',
      'steg.com.tn',
      'tap.info.tn',
      'leaders.com.tn',
      'businessnews.com.tn',
      'kapitalis.com',
      'nawaat.org',
      'inkyfada.com',
      'alkatiba.com',
      'api.open-meteo.com',
      'raw.githubusercontent.com',
    ];

    try {
      const parsedTarget = new URL(target);
      const isAllowed = ALLOWED_APIS.some(domain =>
        parsedTarget.hostname.includes(domain)
      );

      if (!isAllowed) {
        return res.status(403).send('Not allowed');
      }

      // Use insecure agent for Tunisian institutional sites which often have certificate chain issues
      const problematicDomains = [
        'tap.info.tn', 'inkyfada.com', 'nawaat.org', 'businessnews.com.tn', 
        'kapitalis.com', 'reuters.com', 'france24.com', 'tafneed.org', 
        'africanmanager.com', 'realites.com.tn', 'gnet.tn', 'middleeasteye.net',
        'jeuneafrique.com', 'aljazeera.net', 'jawharafm.net', 'leconomistemaghrebin.com',
        'espacemanager.com', 'tunisienumerique.com', 'bct.gov.tn', 'ins.tn', 'steg.com.tn'
      ];
      const useInsecure = problematicDomains.some(d => parsedTarget.hostname.includes(d));
      const useMobile = req.query.mobile === 'true';

      const fetchWithRetry = async (url: string, options: any, retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            return await fetch(url, options);
          } catch (err) {
            if (i === retries) throw err;
            console.warn(`Retry ${i + 1} for ${url} due to ${err}`);
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        throw new Error('Max retries reached');
      };

      const response = await fetchWithRetry(target, {
        agent: useInsecure 
          ? (new URL(target).protocol === 'https:' ? insecureHttpsAgent : insecureHttpAgent)
          : undefined,
        headers: {
          'User-Agent': useMobile 
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 30000,
      });
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

  // 2. Generic Proxy API - Catch-all for other /api requests to FastAPI backend
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    ws: true, // proxy websockets
  }));

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

  // ── AgriIntel Satellite Ingestion Schedule ─────────────────────
  // Run once on startup, then every 6 hours for rainfall
  // NDVI runs every 3 days (cached by the processor)
  
  let IS_INGESTING = false;

  const runAgriPipeline = async () => {
    if (!supabaseServer) {
        console.warn('[AgriIntel] Skipping scheduled ingestion: Supabase client not initialized.');
        return;
    }
    if (IS_INGESTING) {
      console.log('[AgriIntel] Ingestion already in progress, skipping...');
      return;
    }

    IS_INGESTING = true;
    console.log('[AgriIntel] Running scheduled satellite ingestion…');
    try {
      await runSatelliteIngestion(supabaseServer, io);
    } catch (err) {
      console.error('[AgriIntel] Ingestion failed:', err);
    } finally {
      IS_INGESTING = false;
    }
  };

  // Initial run after 10 seconds (allow server to fully start)
  if (process.env.CORE_NODE_ENV === 'production' || process.env.VITE_SUPABASE_URL) {
    setTimeout(runAgriPipeline, 10_000);
  }

  // Re-run every 6 hours (rainfall) — NDVI uses 3-day cache internally
  setInterval(runAgriPipeline, 6 * 60 * 60 * 1000);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
