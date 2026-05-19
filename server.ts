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

// AI is DISABLED by default. Enable from System Command Center.
console.log('[AI] Server-side AI disabled. Use System Command Center to configure and enable.');

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
      
      // Self-healing schema check — deferred 15s so it never blocks boot.
      // Only runs once per process. Comment out once all tables are stable.
      setTimeout(() => {
        console.log('[SCHEMA] Starting background schema validation…');
        initializeAllSchemas(supabaseServer)
          .then(() => console.log('[SCHEMA] Background schema validation complete.'))
          .catch(err => console.error('[SCHEMA] Background schema validation failed:', err));
      }, 15000);
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

  // Proxy diagnostic — confirms Express handles this directly (not forwarded to Python)
  app.get('/api/proxy-ping', (req, res) => {
    res.json({ status: 'ok', source: 'express', timestamp: new Date().toISOString() });
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

      // Ensure the variables table exists (drop stale version if any, then recreate)
      const { error: dropError } = await supabaseServer.rpc('exec_sql_admin', {
        sql_query: 'DROP TABLE IF EXISTS variables CASCADE;'
      });
      if (dropError) console.warn('[VARIABLE SEED] Drop failed:', dropError.message);

      await new Promise(r => setTimeout(r, 500));

      const { error: tableError } = await supabaseServer.rpc('exec_sql_admin', {
        sql_query: `
          CREATE TABLE "variables" (
            "id" TEXT PRIMARY KEY,
            "code" TEXT,
            "number" INT8,
            "value_2026" FLOAT8,
            "value" FLOAT8,
            "min_value" FLOAT8,
            "max_value" FLOAT8,
            "invert" BOOLEAN,
            "weight" FLOAT8,
            "threshold" FLOAT8,
            "threshold_weight" FLOAT8,
            "volatility" FLOAT8,
            "pipeline_field" TEXT,
            "label" TEXT,
            "source" TEXT,
            "category" TEXT,
            "last_updated" TEXT,
            "nlp_keywords" JSONB DEFAULT '[]',
            "nlp_nudge" FLOAT8 DEFAULT 0
          );
        `
      });

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

      // Upsert in batches using raw SQL (bypasses schema cache)
      let seeded = 0;
      for (let i = 0; i < rows.length; i += 25) {
        const batch = rows.slice(i, i + 25);
        const valueStrings = batch.map((r: any) => {
          const esc = (v: any) => {
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
            if (typeof v === 'number') return v;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return `'${String(v).replace(/'/g, "''")}'`;
          };
          return `(${Object.values(r).map(esc).join(',')})`;
        }).join(',');
        const cols = Object.keys(rows[0]).join(',');
        const sql = `
          INSERT INTO variables (${cols}) VALUES ${valueStrings}
          ON CONFLICT (id) DO UPDATE SET
            value_2026 = EXCLUDED.value_2026,
            last_updated = EXCLUDED.last_updated;
        `;
        const { error } = await supabaseServer.rpc('exec_sql_admin', { sql_query: sql });
        if (error) {
          console.error(`[VARIABLE SEED] Batch ${i / 25 + 1} failed:`, error.message);
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

  // AI rate limiter: sliding window — max 3 requests per 2000ms per client IP
  const AI_LIMIT = { windowMs: 2000, maxReqs: 3 };
  const aiRateLimitMap = new Map<string, number[]>();
  function checkAiRateLimit(ip: string): boolean {
    const now = Date.now();
    let timestamps = aiRateLimitMap.get(ip) || [];
    timestamps = timestamps.filter(t => now - t < AI_LIMIT.windowMs);
    if (timestamps.length >= AI_LIMIT.maxReqs) return false;
    timestamps.push(now);
    aiRateLimitMap.set(ip, timestamps);
    return true;
  }

  // GET /api/ai/models — expose configured AI models (keys never sent to client)
  app.get('/api/ai/models', (req, res) => {
    const configured: { id: string; name: string; provider: string; modelName: string; status: 'online' | 'offline'; env: boolean }[] = [];
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && !openAiKey.includes('MY_')) configured.push({ id: 'env-openai', name: 'GPT-4o', provider: 'openai', modelName: 'gpt-4o', status: 'online', env: true });
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes('MY_')) configured.push({ id: 'env-gemini', name: 'Gemini Flash', provider: 'google', modelName: 'gemini-2.0-flash', status: 'online', env: true });
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (nvidiaKey && !nvidiaKey.includes('MY_')) configured.push({ id: 'env-nvidia', name: 'NVIDIA NIM', provider: 'nvidia', modelName: 'meta/llama-3.1-70b-instruct', status: 'online', env: true });
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && !openRouterKey.includes('MY_')) configured.push({ id: 'env-openrouter', name: 'OpenRouter', provider: 'openrouter', modelName: 'google/gemini-2.0-flash-lite', status: 'online', env: true });
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey && !cerebrasKey.includes('MY_')) configured.push({ id: 'env-cerebras', name: 'Cerebras', provider: 'cerebras', modelName: 'llama3.1-8b', status: 'online', env: true });
    res.json({ models: configured });
  });

  // POST /api/ai/test — test a specific AI provider with a minimal call
  app.post('/api/ai/test', async (req, res) => {
    const { provider, modelName, apiKey: clientKey } = req.body;
    const testPrompt = 'Reply with exactly one word: ok';
    try {
      let ok = false;
      if (provider === 'openai') {
        const key = clientKey || process.env.OPENAI_API_KEY;
        if (key && !key.includes('MY_')) {
          const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName || 'gpt-4o', messages: [{ role: 'user', content: testPrompt }], max_tokens: 4 }),
          });
          ok = r.ok;
        }
      } else if (provider === 'google') {
        const key = clientKey || process.env.GEMINI_API_KEY;
        if (key && !key.includes('MY_')) {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: modelName || 'gemini-2.0-flash' });
          const result = await model.generateContent(testPrompt);
          const response = await result.response;
          ok = !!response.text();
        }
      } else if (provider === 'nvidia') {
        const key = clientKey || process.env.NVIDIA_API_KEY;
        if (key && !key.includes('MY_')) {
          const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName || 'meta/llama-3.1-70b-instruct', messages: [{ role: 'user', content: testPrompt }], max_tokens: 4 }),
          });
          ok = r.ok;
        }
      } else if (provider === 'openrouter') {
        const key = clientKey || process.env.OPENROUTER_API_KEY;
        if (key && !key.includes('MY_')) {
          const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001', 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName || 'google/gemini-2.0-flash-lite', messages: [{ role: 'user', content: testPrompt }], max_tokens: 4 }),
          });
          ok = r.ok;
        }
      } else if (provider === 'cerebras') {
        const key = clientKey || process.env.CEREBRAS_API_KEY;
        if (key && !key.includes('MY_')) {
          const modelToTest = modelName || 'llama3.1-8b';
          console.log(`[AI TEST] Testing Cerebras with model: ${modelToTest}`);
          const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelToTest, messages: [{ role: 'user', content: testPrompt }], max_tokens: 4 }),
          });
          if (!r.ok) {
            const errText = await r.text();
            console.error(`[AI TEST] Cerebras Failed: ${r.status} - ${errText}`);
            throw new Error(`Cerebras API Error (${r.status}): ${errText}`);
          }
          ok = r.ok;
        }
      } else if (provider === 'mistral') {
        const key = clientKey || process.env.MISTRAL_API_KEY;
        if (key && !key.includes('MY_')) {
          const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName || 'mistral-large-latest', messages: [{ role: 'user', content: testPrompt }], max_tokens: 4 }),
          });
          ok = r.ok;
        }
      } else if (provider === 'anthropic') {
        const key = clientKey || process.env.ANTHROPIC_API_KEY;
        if (key && !key.includes('MY_')) {
          const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName || 'claude-3-haiku-latest', max_tokens: 10, messages: [{ role: 'user', content: testPrompt }] }),
          });
          ok = r.ok;
        }
      } else if (clientKey) {
        // Custom / OpenAI-compatible provider — use provided baseUrl or default
        const baseUrl = (req.body.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
        const r = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${clientKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelName || 'gpt-4o', messages: [{ role: 'user', content: testPrompt }], max_tokens: 4 }),
        });
        ok = r.ok;
      }
      res.json({ ok, checkedAt: new Date().toISOString() });
    } catch (e: any) {
      res.json({ ok: false, error: e.message, checkedAt: new Date().toISOString() });
    }
  });

  // POST /api/ai/provider-models — fetch available models for a given provider + key
  app.post('/api/ai/provider-models', async (req, res) => {
    const { provider, apiKey: clientKey } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'provider required' });
    }

    try {
      let models: string[] = [];
      const apiKey = clientKey || (
        provider === 'google' ? process.env.GEMINI_API_KEY :
        provider === 'openai' ? process.env.OPENAI_API_KEY :
        provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
        provider === 'cerebras' ? process.env.CEREBRAS_API_KEY :
        provider === 'mistral' ? process.env.MISTRAL_API_KEY :
        provider === 'nvidia' ? process.env.NVIDIA_API_KEY :
        provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : null
      );

      if (!apiKey || apiKey.includes('MY_')) {
        return res.status(400).json({ error: `API Key missing or invalid for provider: ${provider}` });
      }

      if (provider === 'google') {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
        models = (data.models || [])
          .map((m: any) => m.name?.replace('models/', '') || m.name)
          .filter((m: string) => m.includes('gemini'));

      } else if (provider === 'openai') {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
        models = (data.data || [])
          .map((m: any) => m.id)
          .filter((id: string) => id.startsWith('gpt'))
          .sort();

      } else if (provider === 'anthropic') {
        const r = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
        models = (data.data || []).map((m: any) => m.id);

      } else if (provider === 'cerebras') {
        const r = await fetch('https://api.cerebras.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
        models = (data.data || []).map((m: any) => m.id);

      } else if (provider === 'mistral') {
        const r = await fetch('https://api.mistral.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
        models = (data.data || []).map((m: any) => m.id).sort();

      } else if (provider === 'nvidia') {
        const r = await fetch('https://integrate.api.nvidia.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
        models = (data.data || []).map((m: any) => m.id);

      } else if (provider === 'openrouter') {
        const r = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
        models = (data.data || []).map((m: any) => m.id).sort();

      } else {
        return res.status(400).json({ error: `Provider '${provider}' not supported for model discovery` });
      }

      res.json({ models });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Failed to fetch models' });
    }
  });

  // AI Proxy Endpoint — DISABLED by default. Enable from System Command Center.
  // Helper: try a single OpenAI-compatible provider with 30s timeout
  async function tryProvider(url: string, apiKey: string | undefined, model: string, prompt: string): Promise<string> {
    if (!apiKey || apiKey.includes('MY_')) return '';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!r.ok) { console.warn(`[AI] ${url} status=${r.status}`); return ''; }
      const d = await r.json();
      return d.choices?.[0]?.message?.content || '';
    } catch (e: any) { console.warn(`[AI] ${url} error: ${e.message}`); return ''; }
  }

  // POST /api/ai — call an AI provider with a full prompt (with fallback chain)
  app.post('/api/ai', async (req, res) => {
    const { prompt, config } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    // Build ordered provider list: requested provider first, then fallbacks
    const requestedProvider = config?.provider || '';
    const requestedModel = config?.model || '';
    const fallbackChain: { p: string; k: string | undefined; m: string; url: string }[] = [];

    function push(p: string, k: string | undefined, m: string, url: string) {
      if (k && !k.includes('MY_')) fallbackChain.push({ p, k, m, url });
    }

    // Insert requested provider first if known
    if (requestedProvider === 'openai') push('openai', process.env.OPENAI_API_KEY, requestedModel || 'gpt-4o', 'https://api.openai.com/v1/chat/completions');
    else if (requestedProvider === 'cerebras') push('cerebras', process.env.CEREBRAS_API_KEY, requestedModel || 'llama3.1-8b', 'https://api.cerebras.ai/v1/chat/completions');
    else if (requestedProvider === 'google') { /* handled separately below */ }
    else if (requestedProvider === 'nvidia') push('nvidia', process.env.NVIDIA_API_KEY, requestedModel || 'meta/llama-3.1-70b-instruct', 'https://integrate.api.nvidia.com/v1/chat/completions');
    else if (requestedProvider === 'openrouter') push('openrouter', process.env.OPENROUTER_API_KEY, requestedModel || 'google/gemini-2.0-flash-lite', 'https://openrouter.ai/api/v1/chat/completions');
    else if (requestedProvider === 'mistral') push('mistral', process.env.MISTRAL_API_KEY, requestedModel || 'mistral-large-latest', 'https://api.mistral.ai/v1/chat/completions');

    // Then add fallbacks in priority order
    for (const entry of [
      { p: 'cerebras', k: process.env.CEREBRAS_API_KEY, m: 'llama3.1-8b', url: 'https://api.cerebras.ai/v1/chat/completions' },
      { p: 'openai', k: process.env.OPENAI_API_KEY, m: 'gpt-4o', url: 'https://api.openai.com/v1/chat/completions' },
      { p: 'nvidia', k: process.env.NVIDIA_API_KEY, m: 'meta/llama-3.1-70b-instruct', url: 'https://integrate.api.nvidia.com/v1/chat/completions' },
      { p: 'openrouter', k: process.env.OPENROUTER_API_KEY, m: 'google/gemini-2.0-flash-lite', url: 'https://openrouter.ai/api/v1/chat/completions' },
      { p: 'mistral', k: process.env.MISTRAL_API_KEY, m: 'mistral-large-latest', url: 'https://api.mistral.ai/v1/chat/completions' },
    ]) {
      if (entry.k && !entry.k.includes('MY_') && !fallbackChain.some(f => f.p === entry.p)) {
        fallbackChain.push(entry);
      }
    }

    async function tryGoogle(model: string): Promise<string> {
      const key = process.env.GEMINI_API_KEY;
      if (!key || key.includes('MY_')) return '';
      try {
        console.log(`[AI] Trying google (${model})`);
        const genAI = new GoogleGenerativeAI(key);
        const gModel = genAI.getGenerativeModel({ model });
        const result = await gModel.generateContent(prompt);
        return (await result.response).text() || '';
      } catch (e: any) { console.warn(`[AI] google error: ${e.message}`); return ''; }
    }

    async function tryAnthropic(model: string): Promise<string> {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key || key.includes('MY_')) return '';
      try {
        console.log(`[AI] Trying anthropic (${model})`);
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!r.ok) { console.warn(`[AI] anthropic status=${r.status}`); return ''; }
        const d = await r.json();
        return d.content?.[0]?.text || '';
      } catch (e: any) { console.warn(`[AI] anthropic error: ${e.message}`); return ''; }
    }

    try {
      let text = '';
      let usedProvider = '';
      let usedModel = '';

      // Try requested special providers first
      if (requestedProvider === 'google') {
        text = await tryGoogle(requestedModel || 'gemini-2.0-flash');
        if (text) { usedProvider = 'google'; usedModel = requestedModel || 'gemini-2.0-flash'; }
      } else if (requestedProvider === 'anthropic') {
        text = await tryAnthropic(requestedModel || 'claude-3-haiku-latest');
        if (text) { usedProvider = 'anthropic'; usedModel = requestedModel || 'claude-3-haiku-latest'; }
      }

      // Try OpenAI-compatible fallback chain
      if (!text) {
        for (const entry of fallbackChain) {
          console.log(`[AI] Trying ${entry.p} (${entry.m})`);
          text = await tryProvider(entry.url, entry.k, entry.m, prompt);
          if (text) { usedProvider = entry.p; usedModel = entry.m; break; }
        }
      }

      // Fallback to Google / Anthropic if not tried yet
      if (!text) {
        if (requestedProvider !== 'google') {
          text = await tryGoogle('gemini-2.0-flash');
          if (text) { usedProvider = 'google'; usedModel = 'gemini-2.0-flash'; }
        }
        if (!text && requestedProvider !== 'anthropic') {
          text = await tryAnthropic('claude-3-haiku-latest');
          if (text) { usedProvider = 'anthropic'; usedModel = 'claude-3-haiku-latest'; }
        }
      }

      if (!text) text = `[AI: all providers returned empty response]`;
      console.log(`[AI] Responding via ${usedProvider || 'none'} (${usedModel || '—'})`);
      res.json({ text, provider: usedProvider, model: usedModel });
    } catch (e: any) {
      console.error(`[AI] Fatal: ${e.message}`);
      res.json({ text: `[AI Error: ${e.message}]` });
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

  // POST body forwarder — express.json() consumes the body before the proxy can read it
  // This handler explicitly forwards POST bodies to the Python backend
  app.post('/api/*', async (req, res) => {
    try {
      const targetUrl = `http://localhost:8000${req.originalUrl}`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(502).json({ error: 'Backend inaccessible', message: err.message });
    }
  });

  // 2. Generic Proxy API - Integrated middleware to ensure prefix stability
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    ws: true,
    pathFilter: ['/api', '/ws'],
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
        server: {
          middlewareMode: true,
          watch: { ignored: ['**/log_terminal.txt'] },
        },
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

    // Auto-seed variables and knowledge graph into Supabase after server starts (DISABLED - memory)
    // setTimeout(async () => {
    //   try {
    //     const protocol = 'http';
    //     const host = 'localhost';
    //     const varRes = await fetch(`${protocol}://${host}:${PORT}/api/variables/seed`, { method: 'POST' });
    //     const varResult = await varRes.json();
    //     if (varResult.success) {
    //       console.log(`[AUTO-SEED] ${varResult.seeded} variables seeded into Supabase`);
    //     } else {
    //       console.warn('[AUTO-SEED] Variables seed failed:', varResult.error);
    //     }
    //     const graphRes = await fetch(`${protocol}://${host}:${PORT}/api/graph/seed`, { method: 'POST' });
    //     const graphResult = await graphRes.json();
    //     if (graphResult.entities_seeded !== undefined) {
    //       console.log(`[AUTO-SEED] ${graphResult.entities_seeded} entities, ${graphResult.relations_seeded} relations seeded into Knowledge Graph`);
    //     }
    //   } catch (e: any) {
    //     console.warn('[AUTO-SEED] Seed request failed:', e.message);
    //   }
    // }, 3000);

    // Auto-start Telegram collection after backend is up (DISABLED)
    // setTimeout(async () => {
    //   try {
    //     const res = await fetch(`http://localhost:${PORT}/api/telegram/collect`, { method: 'POST' });
    //     const result = await res.json();
    //     if (result.status === 'ok') {
    //       console.log(`[TELEGRAM] Collected ${result.stored} new messages from ${result.channels_active} channels`);
    //     } else if (result.status === 'no_credentials') {
    //       console.log('[TELEGRAM] No credentials — skipping Telegram collection');
    //     } else {
    //       console.warn('[TELEGRAM] Collection result:', result);
    //     }
    //   } catch (e: any) {
    //     console.warn('[TELEGRAM] Initial collect failed:', e.message);
    //   }
    // }, 8000);
  });
}

startServer();
