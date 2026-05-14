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
import ws from 'ws';
import 'dotenv/config';
import { runSatelliteIngestion, getLatestAgriReadings } from './src/pipeline/satellite/satelliteIngestion.ts';
import { createClient } from '@supabase/supabase-js';
import { initializeAllSchemas } from './src/utils/schemaValidator.ts';
import { logBootEvent, logSection, BootMarkers, printBootSummary } from './src/utils/bootSequence.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { spawn } from 'child_process';

logSection('=== TUNISIAINTEL BOOT SEQUENCE ===');
BootMarkers.BACKEND_START();

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

if (!genAI) {
  console.warn("AI disabled");
}

// Start the Python FastAPI backend on port 8000
function startPythonBackend() {
  logBootEvent('BACKEND', 'Python Backend Starting', Date.now());
  console.log('Starting Python backend intelligence engine...');
  const backendPath = path.join(__dirname, 'backend');
  
  if (!fs.existsSync(backendPath)) {
    console.error(`ERROR: Backend directory not found at ${backendPath}`);
    return null;
  }

  const pythonPath = path.join(__dirname, 'venv', 'bin', 'python3');
  const pythonExec = fs.existsSync(pythonPath) ? pythonPath : 'python3';

  const pythonProcess = spawn(pythonExec, ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: backendPath,
    stdio: 'pipe', // Capture output
    env: { ...process.env, PYTHONPATH: backendPath }
  });

  pythonProcess.stdout?.on('data', (data) => {
    console.log(`[Python Stdout]: ${data}`);
  });

  pythonProcess.stderr?.on('data', (data) => {
    console.error(`[Python Stderr]: ${data}`);
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend process:', err);
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
const pythonBackendRequirements = async () => {
  const backendPath = path.join(__dirname, 'backend');
  const reqsPath = path.join(backendPath, 'requirements.txt');
  
  if (fs.existsSync(reqsPath)) {
    console.log('[Python] Installing requirements from:', reqsPath);
    try {
      const pythonPath = path.join(__dirname, 'venv', 'bin', 'python3');
      const pythonExec = fs.existsSync(pythonPath) ? pythonPath : 'python3';
      
      const pip = spawn(pythonExec, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
        cwd: backendPath,
        stdio: 'inherit'
      });
      
      await new Promise((resolve) => {
        pip.on('error', (err) => {
          console.warn(`[Python] pip install spawn error:`, err);
          resolve(-1);
        });
        pip.on('exit', (code) => {
          if (code !== 0) console.warn(`[Python] pip install exited with code ${code}`);
          resolve(code);
        });
      });
    } catch (err) {
      console.error('[Python] Failed to run pip install:', err);
    }
  }
  
  startPythonBackend();
};

startPythonBackend();

// Agent that ignores SSL errors for problematic institutional sites
const insecureHttpsAgent = new https.Agent({
  rejectUnauthorized: false
});

import http from 'http';
const insecureHttpAgent = new http.Agent({
  keepAlive: true
});

async function startServer() {
  logBootEvent('BACKEND', 'Express Server Init Starting', Date.now());
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  logBootEvent('BACKEND', 'Express Server Init Complete', Date.now());

  // Safe Supabase initialization
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  
  let supabaseServer: any = null;
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseServer = createClient(supabaseUrl, supabaseKey, {
        realtime: {
          // @ts-ignore - ws type mismatch with Supabase internal types in Node environment
          transport: ws,
        },
      });
      console.log('[Supabase] Server-side client initialized with URL:', supabaseUrl);
      
      // Self-healing: Initialize and fix schemas on startup
      // Disabled — all tables already have columns from initial setup.
      // Re-enable if new tables/columns are added to SCHEMA_MAP in schemaValidator.ts
      // initializeAllSchemas(supabaseServer).catch(err => {
      //   console.error('[Supabase] Schema initialization failed:', err);
      // });
    } catch (err) {
      console.error('[Supabase] Failed to initialize client:', err);
    }
  } else {
    console.error('[Supabase] URL or KEY missing! SUPABASE_URL:', !!supabaseUrl, 'SUPABASE_SERVICE_KEY:', !!supabaseKey);
  }

  const PORT = process.env.PORT || 3001;
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });
  BootMarkers.BACKEND_SOCKETIO_INIT();

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
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAIApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    const nvidiaKey = process.env.NVIDIA_AI_API_KEY || process.env.NVIDIA_API_KEY;

    res.json({ 
      status: 'ok', 
      gemini: {
        key_exists: !!geminiKey,
        key_is_placeholder: geminiKey ? geminiKey.includes('MY_GEMINI_API_KEY') : false
      },
      openai: {
        key_exists: !!openAIApiKey,
        key_is_placeholder: openAIApiKey ? openAIApiKey.includes('MY_OPENAI_API_KEY') : false
      },
      nvidia: {
        key_exists: !!nvidiaKey,
        key_is_placeholder: nvidiaKey ? (nvidiaKey.includes('MY_NVIDIA_API_KEY') || nvidiaKey.includes('placeholder')) : false
      },
      // Keep legacy top-level for backwards compatibility if needed
      key_exists: !!geminiKey, 
      key_is_placeholder: geminiKey ? geminiKey.includes('MY_GEMINI_API_KEY') : false
    });
  });

  // Intelligence Variables Endpoint (Node implementation fallback)
  app.get('/api/variables', (req, res) => {
    try {
      const pathsToTry = [
        path.join(__dirname, 'backend', 'app', 'data', 'rri_variables.json'),
        path.join(process.cwd(), 'backend', 'app', 'data', 'rri_variables.json'),
        path.resolve('backend/app/data/rri_variables.json'),
        '/backend/app/data/rri_variables.json',
        './backend/app/data/rri_variables.json'
      ];
      
      let dataPath = null;
      for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
          dataPath = p;
          break;
        }
      }

      if (dataPath) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(raw);
        return res.json(data.variables || []);
      }
      
      console.error('Variables data not found. Tried paths:', pathsToTry);
      res.status(404).json({ error: 'Variables data not found', triedPaths: pathsToTry });
    } catch (error) {
      console.error('Error serving variables:', error);
      res.status(500).json({ error: 'Internal server error serving variables' });
    }
  });

  // Seed intelligence variables into Supabase
  app.post('/api/variables/seed', async (req, res) => {
    if (!supabaseServer) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }

    try {
      const pathsToTry = [
        path.join(__dirname, 'backend', 'app', 'data', 'rri_variables.json'),
        path.join(process.cwd(), 'backend', 'app', 'data', 'rri_variables.json'),
        path.resolve('backend/app/data/rri_variables.json'),
        path.join(__dirname, 'src', 'data', 'rri_variables.json'),
      ];

      let dataPath = null;
      for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
          dataPath = p;
          break;
        }
      }

      if (!dataPath) {
        return res.status(404).json({ success: false, error: 'Variables file not found' });
      }

      // Ensure the variables table exists
      const { error: tableError } = await supabaseServer.rpc('exec_sql_admin', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS variables (
            id TEXT PRIMARY KEY, code TEXT, number INT8, value_2026 FLOAT8,
            value FLOAT8, min_value FLOAT8, max_value FLOAT8, invert BOOLEAN,
            weight FLOAT8, threshold FLOAT8, threshold_weight FLOAT8,
            volatility FLOAT8, pipeline_field TEXT, label TEXT, source TEXT,
            category TEXT, last_updated TEXT,
            nlp_keywords JSONB DEFAULT '[]', nlp_nudge FLOAT8 DEFAULT 0
          );
        `
      });
      if (tableError) {
        console.warn('[VARIABLE SEED] Could not create table:', tableError.message);
      }

      const raw = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(raw);
      const variables = data.variables || [];

      if (!Array.isArray(variables) || variables.length === 0) {
        return res.status(400).json({ success: false, error: 'No variables found in file' });
      }

      const rows = variables.map((v: any) => ({
        id: v.id || `${v.code}${v.number}`,
        code: v.code,
        number: v.number,
        value_2026: v.value_2026 ?? 0,
        value: v.value ?? 0,
        min_value: v.min_value ?? 0,
        max_value: v.max_value ?? 100,
        invert: v.invert ?? false,
        weight: v.weight ?? 0.05,
        threshold: v.threshold ?? null,
        threshold_weight: v.threshold_weight ?? 1.2,
        volatility: v.volatility ?? 0.1,
        pipeline_field: v.pipeline_field || null,
        label: v.label || '',
        source: v.source || 'rri_variables.json',
        category: v.category || v.code || '',
        last_updated: new Date().toISOString().slice(0, 10),
        nlp_keywords: v.nlp_keywords || [],
        nlp_nudge: v.nlp_nudge ?? 0,
      }));

      // Upsert in batches of 50 to avoid payload limits
      let seeded = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabaseServer
          .from('variables')
          .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          console.error(`[VARIABLE SEED] Batch ${i / 50 + 1} failed:`, error.message);
        } else {
          seeded += batch.length;
        }
      }

      console.log(`[VARIABLE SEED] Successfully seeded ${seeded}/${variables.length} variables into Supabase`);
      res.json({ success: true, seeded, total: variables.length });
    } catch (error: any) {
      console.error('[VARIABLE SEED] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Proxy Endpoint
  app.post('/api/ai', async (req, res) => {
    console.log('Received request to /api/ai');
    const { prompt, config } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 1. TRY OPENAI FIRST (User requested priority)
    const openAIApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (openAIApiKey && !openAIApiKey.includes('MY_OPENAI_API_KEY')) {
      try {
        console.log('Attempting OpenAI generation...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config?.model?.includes('gpt') ? config.model : 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: config?.temperature ?? 0.1,
            top_p: config?.topP ?? 0.8,
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0].message.content });
        } else if (response.status === 429) {
          console.info('[AI] OpenAI rate limited. Falling back...');
        } else {
          const errorData = await response.text();
          console.warn(`[AI] OpenAI failed (Status ${response.status}). Falling back to Gemini...`);
        }
      } catch (error: any) {
        console.warn('OpenAI primary attempt errored. Falling back to Gemini...', error.message);
      }
    }

    // 2. FALLBACK TO GEMINI (Primary fallback)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes('MY_GEMINI_API_KEY')) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      try {
        console.log('Attempting Gemini generation...');
        const model = genAI.getGenerativeModel({ 
          model: config?.model?.includes('gemini') ? config.model : 'gemini-1.5-flash',
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
        return res.json({ text });
      } catch (error: any) {
        console.error('Gemini Error (fallback):', error);
      }
    }

    // 3. TRY NVIDIA (NIM / CUDA)
    const nvidiaKey = process.env.NVIDIA_AI_API_KEY || process.env.NVIDIA_API_KEY;
    if (nvidiaKey && !nvidiaKey.includes('MY_NVIDIA_API_KEY')) {
      try {
        console.log('Attempting NVIDIA NIM generation...');
        const isNvidiaModel = config?.model?.includes('nvidia') || config?.model?.includes('llama-3.1');
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: isNvidiaModel ? config.model : 'meta/llama-3.1-70b-instruct',
            messages: [{ role: 'user', content: prompt }],
            temperature: config?.temperature ?? 0.1,
            top_p: config?.topP ?? 0.7,
            max_tokens: config?.maxTokens || 2048,
          })
        });

        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0].message.content });
        }
      } catch (error: any) {
        console.warn('NVIDIA check failed, continuing...', error.message);
      }
    }

    // 4. SECONDARY FALLBACK: OpenRouter
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (openRouterApiKey && !openRouterApiKey.includes('MY_OPENROUTER_API_KEY')) {
      try {
        console.log('Attempting OpenRouter generation...');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'https://ais.studio',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config?.model || 'google/gemini-2.0-flash-lite',
            messages: [{ role: 'user', content: prompt }]
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0].message.content });
        }
      } catch (error: any) {
        console.error('OpenRouter Error:', error);
      }
    }

    // 4. FINAL FAILSAFE
    const isPlaceholder = (geminiKey && geminiKey.includes('MY_GEMINI_API_KEY')) || (openAIApiKey && openAIApiKey.includes('MY_OPENAI_API_KEY'));
    
    return res.status(200).json({ 
      text: `[SYSTEM DIAGNOSTIC: AI engine is offline. ${isPlaceholder ? 'Placeholder API key detected.' : 'Missing API keys.'} Please verify your OPENAI_API_KEY or GEMINI_API_KEY in the environment settings.]`
    });
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
      // ── News API providers (Phase 3 pipeline) ──────────────────────────
      'newsapi.org',
      'newsdata.io',
      'gnews.io',
      // ── Telegram RSS bridges ───────────────────────────────────────────
      'tg.i-c-a.ru',
      'rsshub.app',
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

  // 2. Generic Proxy API - Integrated middleware to ensure prefix stability
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    ws: true,
    pathFilter: ['/api', '/ws'], // Prevents stripping prefixes by default
    on: {
      error: (err, req, res: any) => {
        console.error('[Proxy Error]:', err.message);
        if (res && typeof res.status === 'function') {
          res.status(502).json({ 
            error: 'Backend inaccessible', 
            message: 'TunisiaIntel intelligence engine is starting or unavailable.',
            details: err.message
          });
        } else if (res && typeof res.destroy === 'function') {
          // It's a net.Socket from a WebSocket upgrade
          res.destroy();
        }
      }
    }
  });
  
  app.use(apiProxy);

  // Prevent API and WS requests from falling through to the Catch-all SPA route
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });
  app.all('/ws/*', (req, res) => {
    res.status(404).json({ error: 'WebSocket route not found' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      logBootEvent('APP_INIT', 'Vite Starting', Date.now());
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      logBootEvent('APP_INIT', 'Vite Ready', Date.now());
      app.use(vite.middlewares);
    } catch (viteError) {
      console.error('Vite initialization failed:', viteError);
      app.get('*', (req, res) => {
        res.status(503).send(`
          <html>
            <head><title>TunisiaIntel - Loading</title></head>
            <body style="background:#0a0c10;color:#00f2ff;font-family:monospace;text-align:center;padding:50px;">
              <h1>INITIALIZING INTELLIGENCE CORE...</h1>
              <p>Please refresh the page in a moment.</p>
            </body>
          </html>
        `);
      });
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Handle WebSocket upgrades for proxied routes
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/ws') || req.url?.startsWith('/api')) {
      apiProxy.upgrade(req, socket as any, head);
    }
  });

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

  // Satellite ingestion runs every 6 hours. First trigger happens
  // on-demand when the user opens the Agriculture page in the app.
  setInterval(runAgriPipeline, 6 * 60 * 60 * 1000);

  httpServer.listen(PORT, '0.0.0.0', () => {
    BootMarkers.BACKEND_READY();
    logSection('>>> SERVER READY - FRONTEND BOOT CAN BEGIN');
    console.log(`Server running on http://localhost:${PORT}`);

    // Auto-seed variables into Supabase after server starts
    setTimeout(async () => {
      try {
        const protocol = 'http';
        const host = 'localhost';
        const res = await fetch(`${protocol}://${host}:${PORT}/api/variables/seed`, { method: 'POST' });
        const result = await res.json();
        if (result.success) {
          console.log(`[AUTO-SEED] ${result.seeded} variables seeded into Supabase`);
        } else {
          console.warn('[AUTO-SEED] Seed failed:', result.error);
        }
      } catch (e: any) {
        console.warn('[AUTO-SEED] Seed request failed:', e.message);
      }
    }, 2000);
  });
}

startServer();
