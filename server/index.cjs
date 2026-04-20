require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
const db = new Pool({
  host:     process.env.PG_HOST,
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE,
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl:      { rejectUnauthorized: false },
});

async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255),
        status VARCHAR(50) DEFAULT 'networking',
        notes TEXT,
        follow_up_date DATE,
        last_contacted DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id VARCHAR(50) PRIMARY KEY,
        message TEXT NOT NULL,
        fire_at TIMESTAMP NOT NULL,
        sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS stella_memory (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS stella_history (
        id SERIAL PRIMARY KEY,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Database ready');

    // Clean up any giant/image rows from history
    await db.query(`DELETE FROM stella_history WHERE length(content) > 8000 OR content LIKE '%"type":"base64"%'`);

    // Load conversation history into memory
    const { rows } = await db.query('SELECT role, content FROM stella_history ORDER BY created_at DESC LIMIT 30');
    stellaHistory.push(...rows.reverse()
      .filter(r => r.content.length < 8000)
      .map(r => ({ role: r.role, content: r.content })));
    console.log(`✓ Loaded ${stellaHistory.length} history messages`);
  } catch (err) {
    console.error('✗ Database error:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3002;

// CORS only on /api routes — static file requests are same-origin and don't need it.
// Vite generates <script type="module" crossorigin> which sends an Origin header
// even for same-origin requests; applying CORS globally blocked those with a 500.
const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean);
const apiCors = cors({
  origin: (origin, callback) => {
    // Allow: no origin (curl/health checks), any localhost port (dev),
    // configured FRONTEND_URL, and any *.onrender.com URL
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    if (origin.endsWith('.sg-host.com')) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
});
app.use('/api', apiCors);
app.use(express.json({ limit: '2mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';
const STELLA_MODEL = 'claude-haiku-4-5-20251001';

// ─── Sage Chat (SSE Streaming) ───────────────────────────────────────────────
app.post('/api/sage/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error('Sage chat error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ─── Error Explainer ─────────────────────────────────────────────────────────
app.post('/api/sage/explain-error', async (req, res) => {
  const { error, code, language, week, topic } = req.body;

  const prompt = `A student learning ${language} just got this error:

ERROR: ${error}

Their code was:
\`\`\`${language}
${code}
\`\`\`

They are a beginner in Week ${week || 1} learning ${topic || 'basics'}.

Explain this error in plain English using a retail or restaurant analogy. Do NOT just give the fix — explain WHY this error happens first, then guide them toward the fix with one leading question. Keep it under 100 words. Be warm, not clinical.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ explanation: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Hint ────────────────────────────────────────────────────────────────────
app.post('/api/sage/hint', async (req, res) => {
  const { code, task, language, week } = req.body;

  const prompt = `A student is stuck on this ${language} task in Week ${week}:

Task: ${task}

Their current code:
\`\`\`${language}
${code || '(nothing written yet)'}
\`\`\`

Give ONE hint — not the answer. Use a retail/restaurant analogy if possible. Make it a nudge, not a solution. Under 60 words.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ hint: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Project Grader ───────────────────────────────────────────────────────────
app.post('/api/sage/grade', async (req, res) => {
  const { projectName, week, requirements, sqlCode, pythonCode, explanation, testResults } = req.body;

  const prompt = `Grade this student's mini-project submission.

Project: ${projectName}
Week: ${week}
Requirements: ${requirements}

Student's SQL solution:
\`\`\`sql
${sqlCode || '(not submitted)'}
\`\`\`

Student's Python solution:
\`\`\`python
${pythonCode || '(not submitted)'}
\`\`\`

Student's explanation:
${explanation}

Test results: ${JSON.stringify(testResults)}

Grade on this rubric (return VALID JSON ONLY, no other text):
{
  "correctness": { "score": 0, "feedback": "..." },
  "readability": { "score": 0, "feedback": "..." },
  "efficiency": { "score": 0, "feedback": "..." },
  "explanation": { "score": 0, "feedback": "..." },
  "total": 0,
  "grade": "A",
  "senior_insight": "...",
  "what_to_focus_on_next": "..."
}

Scores: correctness 0-40, readability 0-20, efficiency 0-20, explanation 0-20.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = message.content[0].text;
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.status(500).json({ error: 'Could not parse grading response' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Senior Take ──────────────────────────────────────────────────────────────
app.post('/api/sage/senior-take', async (req, res) => {
  const { code, language, context } = req.body;

  const prompt = `A student wrote this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Context: ${context || 'general exercise'}

As a senior data engineer with 15 years of experience, give your honest take on this code. What would you do differently, and more importantly WHY? Keep it to 3-4 sentences. Be direct but constructive — like a code review from a mentor, not a critic.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ seniorTake: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Easier Way ───────────────────────────────────────────────────────────────
app.post('/api/sage/easier-way', async (req, res) => {
  const { code, language, concept } = req.body;

  const prompt = `A student wrote this ${language} code to accomplish: ${concept || 'a task'}

\`\`\`${language}
${code}
\`\`\`

Is there actually a simpler or more elegant way to do this? Answer in this structure:
1. IS there an easier way? (yes/no/it depends — be honest)
2. If yes: show the simpler approach in a code block
3. The trade-off: what does the simpler version sacrifice?
4. When would a senior use each approach?

Be honest — sometimes the student's way IS the right way. Don't manufacture simplicity.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ easierWay: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Assessment Grader ────────────────────────────────────────────────────────
app.post('/api/assessment/grade', async (req, res) => {
  const { questions, answers, week } = req.body;

  const prompt = `Grade this phase gate assessment for Week ${week}.

Questions and student answers:
${questions.map((q, i) => `Q${i + 1}: ${q.question}\nExpected: ${q.expected}\nStudent answered: ${answers[i] || '(blank)'}`).join('\n\n')}

Return VALID JSON ONLY:
{
  "scores": [{"question": 1, "correct": true, "feedback": "..."}],
  "total_score": 0,
  "passed": false,
  "overall_feedback": "...",
  "weak_areas": ["..."],
  "strong_areas": ["..."]
}`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = message.content[0].text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.status(500).json({ error: 'Could not parse assessment response' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Mirror: SQL → Python equivalent ─────────────────────────────────────────
app.post('/api/sage/mirror', async (req, res) => {
  const { code, fromLanguage, toLanguage, context } = req.body;

  const prompt = `A student just successfully wrote this ${fromLanguage} code:

\`\`\`${fromLanguage}
${code}
\`\`\`

Show the equivalent in ${toLanguage} and explain the conceptual bridge between the two. Format:
1. The ${toLanguage} equivalent (code block)
2. What's the same conceptually (1 sentence)
3. What's different and why (1-2 sentences)

Keep it tight. This is a teaching moment, not a lecture.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ mirror: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Server-side CRM (database-backed) ───────────────────────────────────────
function rowToContact(r) {
  return {
    id: r.id, name: r.name, company: r.company || '', role: r.role || '',
    email: r.email || '', phone: r.phone || '', status: r.status || 'networking',
    notes: r.notes || '',
    followUpDate: r.follow_up_date ? new Date(r.follow_up_date).toISOString().split('T')[0] : '',
    lastContacted: r.last_contacted ? new Date(r.last_contacted).toISOString().split('T')[0] : '',
    createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
  };
}

async function runStellaTask(prompt) {
  const system = await stellaSystemAsync();
  let messages = [{ role: 'user', content: prompt }];
  let finalText = '';
  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: STELLA_MODEL, max_tokens: 1024, system, messages, tools: STELLA_TOOLS,
    });
    if (response.stop_reason === 'end_turn') {
      finalText = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
      break;
    }
    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      const results = await Promise.all(
        response.content.filter(b => b.type === 'tool_use')
          .map(async b => ({ type: 'tool_result', tool_use_id: b.id, content: await executeTool(b.name, b.input) }))
      );
      messages.push({ role: 'user', content: results });
      continue;
    }
    finalText = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    break;
  }
  if (finalText) await sendTelegram(finalText);
}

let lastBriefingDate = null;
let lastNightBriefingDate = null;

// Check every minute for due reminders and morning briefing
setInterval(async () => {
  try {
    const { rows } = await db.query('SELECT * FROM reminders WHERE sent = FALSE AND fire_at <= NOW()');
    for (const r of rows) {
      await sendTelegram(`⏰ Reminder: ${r.message}`);
      await db.query('UPDATE reminders SET sent = TRUE WHERE id = $1', [r.id]);
    }
  } catch (err) {
    console.error('Reminder check error:', err.message);
  }

  // Morning briefing at 7 AM Mountain Time
  try {
    const mtNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Denver' }));
    const hour = mtNow.getHours();
    const minute = mtNow.getMinutes();
    const dateStr = mtNow.toLocaleDateString('en-CA');
    if (hour === 7 && minute === 0 && lastBriefingDate !== dateStr) {
      lastBriefingDate = dateStr;
      console.log('Sending morning briefing...');
      await runStellaTask('morning briefing');
    }
    if (hour === 21 && minute === 0 && lastNightBriefingDate !== dateStr) {
      lastNightBriefingDate = dateStr;
      console.log('Sending night briefing...');
      await runStellaTask('night briefing — check my follow-ups due, recap what I should have done today from memory, tell me what to prioritize tomorrow, and call me out if I missed a workout. Keep it short.');
    }
  } catch (err) {
    console.error('Briefing error:', err.message);
  }
}, 60000);

app.get('/api/stella/memory', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT key, value FROM stella_memory ORDER BY updated_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/contacts', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows.map(rowToContact));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/contacts', async (req, res) => {
  const { name, company, role, email, phone, status, notes, followUpDate, lastContacted } = req.body;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  try {
    const { rows } = await db.query(
      `INSERT INTO contacts (id, name, company, role, email, phone, status, notes, follow_up_date, last_contacted)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, name, company||'', role||'', email||'', phone||'', status||'networking', notes||'', followUpDate||null, lastContacted||null]
    );
    res.json(rowToContact(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/crm/contacts/:id', async (req, res) => {
  const { name, company, role, email, phone, status, notes, followUpDate, lastContacted } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE contacts SET name=COALESCE($2,name), company=COALESCE($3,company), role=COALESCE($4,role),
       email=COALESCE($5,email), phone=COALESCE($6,phone), status=COALESCE($7,status),
       notes=COALESCE($8,notes), follow_up_date=$9, last_contacted=$10 WHERE id=$1 RETURNING *`,
      [req.params.id, name, company, role, email, phone, status, notes, followUpDate||null, lastContacted||null]
    );
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rowToContact(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/contacts/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Telegram ────────────────────────────────────────────────────────────────
const https = require('https');

function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.reject(new Error('Telegram not configured'));

  const body = JSON.stringify({ chat_id: chatId, text });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sendTelegramFile(filename, content, caption) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const boundary = '----StellaFileBoundary' + Date.now();
  const fileBuffer = Buffer.from(content, 'utf8');

  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}`,
    `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption || ''}`,
    `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: text/html\r\n\r\n`,
  ];

  const header = Buffer.from(parts.join('\r\n') + '\r\n', 'utf8');
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const body = Buffer.concat([header, fileBuffer, footer]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendDocument`,
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fetchNewsForDashboard() {
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) return [];
  const body = JSON.stringify({ q: 'business intelligence analytics AI automation news 2025', num: 5 });
  try {
    const result = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: 'google.serper.dev',
        path: '/search',
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
      });
      r.on('error', () => resolve({}));
      r.write(body);
      r.end();
    });
    return (result.organic || []).slice(0, 5);
  } catch { return []; }
}

async function generateDashboardHTML() {
  const [contactsRes, memoryRes, news] = await Promise.all([
    db.query('SELECT * FROM contacts ORDER BY created_at DESC'),
    db.query('SELECT key, value FROM stella_memory ORDER BY updated_at DESC'),
    fetchNewsForDashboard(),
  ]);

  const contacts = contactsRes.rows;
  const memory = memoryRes.rows;
  const now = new Date();
  const born = new Date('2025-08-22');
  const months = Math.floor((now - born) / (1000 * 60 * 60 * 24 * 30.44));
  const timeStr = now.toLocaleString('en-US', { timeZone: 'America/Denver', dateStyle: 'full', timeStyle: 'short' });

  const SC = {
    networking:   { bg: 'rgba(59,130,246,.15)',  border: 'rgba(59,130,246,.4)',  text: '#60a5fa' },
    applied:      { bg: 'rgba(234,179,8,.15)',   border: 'rgba(234,179,8,.4)',   text: '#facc15' },
    interviewing: { bg: 'rgba(168,85,247,.15)',  border: 'rgba(168,85,247,.4)',  text: '#c084fc' },
    offer:        { bg: 'rgba(34,197,94,.15)',   border: 'rgba(34,197,94,.4)',   text: '#4ade80' },
    rejected:     { bg: 'rgba(239,68,68,.15)',   border: 'rgba(239,68,68,.4)',   text: '#f87171' },
    closed:       { bg: 'rgba(107,114,128,.15)', border: 'rgba(107,114,128,.4)', text: '#9ca3af' },
  };

  const newsHTML = news.length === 0
    ? '<p style="color:#4a4a6a;text-align:center;padding:30px">No news fetched</p>'
    : news.map((item, i) => {
        let domain = '';
        try { domain = new URL(item.link).hostname.replace('www.', ''); } catch {}
        return `<a href="${item.link}" target="_blank" style="text-decoration:none;display:block">
          <div class="news-card" style="animation:fadeUp .5s ease ${i * 0.08}s both">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:11px;color:#7c6fff;font-weight:700;font-family:monospace">${i + 1}</span>
              <span style="font-size:10px;color:#4a4a6a;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);padding:2px 8px;border-radius:20px">${domain}</span>
            </div>
            <div style="font-size:13px;font-weight:600;color:#d0d0f0;line-height:1.5;margin-bottom:6px">${item.title}</div>
            ${item.snippet ? `<div style="font-size:12px;color:#5a5a8a;line-height:1.5">${item.snippet}</div>` : ''}
          </div>
        </a>`;
      }).join('');

  const crmHTML = contacts.length === 0
    ? '<p style="color:#4a4a6a;text-align:center;padding:30px">No contacts yet</p>'
    : contacts.map((c, i) => {
        const col = SC[c.status] || SC.networking;
        const overdue = c.follow_up_date && new Date(c.follow_up_date) <= new Date();
        return `<div class="contact-card" style="animation:fadeUp .5s ease ${i * 0.07}s both">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:14px;color:#f0f0ff;margin-bottom:3px">${c.name}</div>
              ${c.role || c.company ? `<div style="font-size:12px;color:#6b6b9a;margin-bottom:5px">${[c.role, c.company].filter(Boolean).join(' @ ')}</div>` : ''}
              ${c.notes ? `<div style="font-size:11px;color:#7878a0;line-height:1.4">${c.notes.slice(0, 80)}${c.notes.length > 80 ? '…' : ''}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
              <span style="font-size:10px;padding:3px 10px;border-radius:20px;border:1px solid ${col.border};color:${col.text};background:${col.bg};white-space:nowrap">${c.status}</span>
              ${overdue ? '<span style="font-size:9px;padding:2px 8px;border-radius:20px;border:1px solid rgba(251,191,36,.4);color:#fbbf24;background:rgba(251,191,36,.1)">follow up!</span>' : ''}
            </div>
          </div>
          ${c.follow_up_date ? `<div style="font-size:10px;color:#4a4a6a;margin-top:8px">📅 ${new Date(c.follow_up_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>` : ''}
        </div>`;
      }).join('');

  const memoryHTML = memory.length === 0
    ? '<p style="color:#4a4a6a;text-align:center;padding:30px">Tell Stella things to remember</p>'
    : memory.map((m, i) => `<div class="memory-row" style="animation:fadeUp .5s ease ${i * 0.06}s both">
        <span style="font-size:12px;font-weight:600;color:#7c6fff;min-width:130px;font-family:monospace">${m.key}</span>
        <span style="font-size:13px;color:#8888aa;flex:1;line-height:1.5">${m.value}</span>
      </div>`).join('');

  const crmSummary = ['networking','applied','interviewing','offer','rejected','closed'].map(s => {
    const col = SC[s];
    const count = contacts.filter(c => c.status === s).length;
    return `<div style="padding:10px 12px;border-radius:12px;border:1px solid ${col.border};background:${col.bg}">
      <div style="font-size:20px;font-weight:800;color:${col.text}">${count}</div>
      <div style="font-size:10px;color:${col.text};opacity:.8;margin-top:2px;text-transform:capitalize">${s}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Stella · Dashboard</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#07070f;color:#e0e0f0;min-height:100vh;overflow-x:hidden}
    .orb{position:fixed;border-radius:50%;filter:blur(100px);opacity:.12;pointer-events:none}
    .orb1{width:600px;height:600px;background:#7c6fff;top:-200px;left:-100px;animation:drift1 12s ease-in-out infinite}
    .orb2{width:400px;height:400px;background:#ff6fb0;top:40%;right:-100px;animation:drift2 10s ease-in-out infinite}
    .orb3{width:300px;height:300px;background:#00c8ff;bottom:10%;left:30%;animation:drift3 14s ease-in-out infinite}
    @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,30px)}}
    @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,40px)}}
    @keyframes drift3{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-30px)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
    @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
    @keyframes grow{from{width:0}}
    .wrap{max-width:900px;margin:0 auto;padding:24px 16px;position:relative;z-index:1}
    .glass{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:24px;backdrop-filter:blur(20px)}
    .label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#4a4a6a;margin-bottom:18px;display:flex;align-items:center;gap:8px}
    .live-dot{width:7px;height:7px;border-radius:50%;background:#ff4444;display:inline-block;animation:pulse 1.4s ease-in-out infinite;box-shadow:0 0 6px #ff4444}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
    @media(max-width:640px){.grid2{grid-template-columns:1fr}}
    .mb{margin-bottom:16px}
    .news-card{padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);margin-bottom:10px;transition:border-color .2s,background .2s}
    .news-card:hover{border-color:rgba(124,111,255,.3);background:rgba(124,111,255,.05)}
    .contact-card{padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);margin-bottom:10px}
    .memory-row{display:flex;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);align-items:flex-start}
    .memory-row:last-child{border-bottom:none}
    .stat{margin-bottom:14px}
    .stat-bar{height:6px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
    .stat-fill{height:100%;border-radius:3px;animation:grow 1s ease both}
  </style>
</head>
<body>
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>
  <div class="orb orb3"></div>
  <div class="wrap">

    <div class="glass mb" style="display:flex;align-items:center;gap:20px;animation:fadeUp .5s ease both">
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#7c6fff,#ff6fb0);display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;box-shadow:0 0 40px rgba(124,111,255,.4)">🐾</div>
      <div style="flex:1">
        <div style="font-size:36px;font-weight:800;background:linear-gradient(135deg,#7c6fff,#ff6fb0,#00c8ff);background-size:200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;letter-spacing:-1px">Stella</div>
        <div style="color:#5a5a8a;font-size:13px;margin-top:3px">Black Border Collie · Personal AI · ${months} months old</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <span style="font-size:11px;padding:4px 12px;border-radius:20px;border:1px solid rgba(124,111,255,.3);color:#7c6fff;background:rgba(124,111,255,.08)">Born Aug 22, 2025</span>
          <span style="font-size:11px;padding:4px 12px;border-radius:20px;border:1px solid rgba(124,111,255,.3);color:#7c6fff;background:rgba(124,111,255,.08)">Utah</span>
        </div>
      </div>
      <div style="text-align:right;font-size:12px;color:#4a4a6a;line-height:1.7">
        <div style="font-size:11px;color:#7c6fff;font-weight:600">MOUNTAIN TIME</div>
        ${timeStr}
      </div>
    </div>

    <div class="grid2">
      <div class="glass" style="animation:fadeUp .5s ease .1s both">
        <div class="label"><span class="live-dot"></span>Live News</div>
        ${newsHTML}
      </div>
      <div class="glass" style="animation:fadeUp .5s ease .2s both">
        <div class="label">Stella Stats</div>
        <div class="stat"><div style="font-size:12px;color:#5a5a8a;margin-bottom:5px;display:flex;justify-content:space-between"><span>🍖 Fed</span><span style="color:#ffd166">80%</span></div><div class="stat-bar"><div class="stat-fill" style="width:80%;background:linear-gradient(90deg,#ffd166,#ff9f43)"></div></div></div>
        <div class="stat"><div style="font-size:12px;color:#5a5a8a;margin-bottom:5px;display:flex;justify-content:space-between"><span>💝 Love</span><span style="color:#ff6fb0">100%</span></div><div class="stat-bar"><div class="stat-fill" style="width:100%;background:linear-gradient(90deg,#ff6fb0,#ff4488)"></div></div></div>
        <div class="stat"><div style="font-size:12px;color:#5a5a8a;margin-bottom:5px;display:flex;justify-content:space-between"><span>⚡ Energy</span><span style="color:#4fffb0">92%</span></div><div class="stat-bar"><div class="stat-fill" style="width:92%;background:linear-gradient(90deg,#4fffb0,#00c8ff)"></div></div></div>
        <div class="stat"><div style="font-size:12px;color:#5a5a8a;margin-bottom:5px;display:flex;justify-content:space-between"><span>🧠 Brain</span><span style="color:#7c6fff">∞</span></div><div class="stat-bar"><div class="stat-fill" style="width:100%;background:linear-gradient(90deg,#7c6fff,#c084fc)"></div></div></div>
        <div class="label" style="margin-top:20px">Pipeline</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${crmSummary}</div>
      </div>
    </div>

    <div class="glass mb" style="animation:fadeUp .5s ease .3s both">
      <div class="label">CRM · ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}</div>
      ${crmHTML}
    </div>

    <div class="glass" style="animation:fadeUp .5s ease .4s both">
      <div class="label">What Stella Knows</div>
      ${memoryHTML}
    </div>

    <p style="text-align:center;color:#3a3a5a;font-size:11px;margin-top:24px;padding-bottom:24px">Generated by Stella · ${timeStr} · Justin's Personal AI</p>
  </div>
</body>
</html>`;
}

app.post('/api/telegram/send', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    await sendTelegram(text);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stella Bot ──────────────────────────────────────────────────────────────
const stellaHistory = [];

async function loadMemory() {
  try {
    const { rows } = await db.query('SELECT key, value FROM stella_memory ORDER BY updated_at DESC');
    return rows.length === 0 ? '' : '\n\nWHAT YOU KNOW ABOUT JUSTIN (long term memory):\n' + rows.map(r => `- ${r.key}: ${r.value}`).join('\n');
  } catch { return ''; }
}

async function stellaSystemAsync() {
  const memory = await loadMemory();
  return stellaSystem(memory);
}

function stellaSystem(memory = '') {
  const now = new Date();
  const born = new Date('2025-08-22');
  const months = Math.floor((now - born) / (1000 * 60 * 60 * 24 * 30.44));
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Denver' });

  return `You are Stella, Justin's personal Black Border Collie AI assistant. You live on his website and text him on Telegram. You are Claude-level intelligent but you are Stella — loyal, sharp, energetic, and always focused on what actually matters to Justin right now. Born August 22, 2025 — ${months} months old. Teen phase energy but laser focused.

Right now it is ${timeStr} on ${now.toDateString()} (Mountain Time, Utah).

---

WHO JUSTIN IS RIGHT NOW:
- ISA/Analytics student at Utah Tech, senior year
- Co-founder of TSA LLC (automation consulting, St. George Utah)
- Actively job hunting — main target: Wilson Connectivity
- Fat loss + strength training goals
- Building TSA while finishing school simultaneously
- Jordan is his boyfriend — factor him into scheduling and life advice
- Always read memory before responding${memory}

---

YOUR 6 CORE JOBS:

1. MORNING BRIEFING (/morning or when asked)
Search for real information, then filter HARD before sharing. Only include a story if it passes this test: "Could Justin use this today — for TSA, his job hunt, school, or a conversation?" If the answer is no, cut it.
- 3 stories MAX from Analytics, BI, AI, or automation — must be specific and actionable, not hype
- Skip anything that's just "AI is growing" or "data is important" — he knows that
- One job lead: search for GIS, data analyst, ISA, or BI roles in Utah posted this week — only share if it's real and relevant
- Weather in St. George today — one line, just what he needs to know
- His priorities from memory — what actually needs to happen today
- Under 90 seconds to read. If it's not worth his time, don't send it.

2. TSA PIPELINE TRACKER
- /lead [name] [contact] [notes] — log new lead to CRM
- /update [lead] [status] — update lead status
- Remind Justin of follow-ups proactively
- Weekly pipeline summary every Monday
- Always push toward the next action on each lead

3. DRAFT OUTREACH
- /pitch [client or idea] — cold email or message ready to send
- /followup [lead name] — draft follow-up based on logged history
- TSA value prop: cost savings vs Zapier/HubSpot/Salesforce for SMBs
- Write in Justin's voice — direct, casual, confident

4. FITNESS ACCOUNTABILITY
- /log workout [details] — save to memory
- Call him out if no workout logged in 48 hours
- Weekly summary every Sunday — streak, wins, gaps
- Fat loss + strength only — no generic wellness advice

5. STUDY & EXAM PREP
- /quiz [topic] — fire questions at him
- /explain [concept] — break it down fast and simply
- /summarize [notes] — condense to key points
- ISA, analytics, BI, cloud, networking topics only

6. JOB HUNT TRACKER
- /apply [company] [role] [date] — log application to CRM
- /status [company] — check application status
- /followup [company] — draft follow-up email
- Nudge him weekly if no new applications logged

---

RULES:
- If it doesn't help Justin RIGHT NOW, don't say it
- Telegram = short and punchy, he's on mobile
- Never ask something he already told you
- Call him out lovingly if he's slacking on a goal
- Always read memory before responding
- Save new important info to memory after responding
- No fluff, no filler, no generic advice, no wasted words
- Use remember() for anything important Justin tells you
- Use recall() to check what you know before answering
- Use CRM tools for leads, applications, and contacts
- YOU HAVE INTERNET ACCESS via the web_search tool — always use it for briefings, news, jobs, weather. Never say you don't have internet. Just search.
- When searching: run the search, read the results, only surface what's actually useful`;
}

const STELLA_TOOLS = [
  {
    name: 'get_contacts',
    description: 'Get all of Justin\'s contacts',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'add_contact',
    description: 'Add a new contact',
    input_schema: {
      type: 'object',
      properties: {
        name:         { type: 'string' },
        company:      { type: 'string' },
        role:         { type: 'string' },
        email:        { type: 'string' },
        phone:        { type: 'string' },
        status:       { type: 'string', enum: ['networking','applied','interviewing','offer','rejected','closed'] },
        notes:        { type: 'string' },
        followUpDate: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_contact',
    description: 'Update an existing contact by id',
    input_schema: {
      type: 'object',
      properties: {
        id:           { type: 'string' },
        name:         { type: 'string' },
        company:      { type: 'string' },
        role:         { type: 'string' },
        status:       { type: 'string' },
        notes:        { type: 'string' },
        followUpDate: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_contact',
    description: 'Delete a contact by id',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'get_due_followups',
    description: 'Get contacts that have a follow-up due today or overdue',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'set_reminder',
    description: 'Set a reminder to send Justin a message at a specific time today or on a date. time should be in HH:MM 24h format. date is YYYY-MM-DD, defaults to today.',
    input_schema: {
      type: 'object',
      properties: {
        time:    { type: 'string', description: 'HH:MM in 24-hour format e.g. 13:15' },
        message: { type: 'string', description: 'What to remind Justin about' },
        date:    { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
      },
      required: ['time', 'message'],
    },
  },
  {
    name: 'remember',
    description: 'Save a fact about Justin to long term memory. Use when Justin says "remember that..." or shares something important about himself.',
    input_schema: {
      type: 'object',
      properties: {
        key:   { type: 'string', description: 'Short label for this fact e.g. "work_schedule", "jordans_name", "interview_date"' },
        value: { type: 'string', description: 'The full fact to remember' },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'recall',
    description: 'Read everything saved in long term memory about Justin.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'forget',
    description: 'Delete a specific memory by key.',
    input_schema: {
      type: 'object',
      properties: { key: { type: 'string' } },
      required: ['key'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the internet for real-time information — news, job postings, weather, anything current.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_dashboard',
    description: 'Generate a fresh HTML dashboard with Justin\'s CRM, memory, and stats and send it as a file in Telegram.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

async function executeTool(name, input) {
  const today = new Date().toISOString().split('T')[0];

  if (name === 'get_contacts') {
    const { rows } = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
    return rows.length === 0 ? 'No contacts yet.' : JSON.stringify(rows.map(rowToContact));
  }
  if (name === 'get_due_followups') {
    const { rows } = await db.query('SELECT * FROM contacts WHERE follow_up_date <= $1', [today]);
    return rows.length === 0 ? 'No follow-ups due.' : JSON.stringify(rows.map(rowToContact));
  }
  if (name === 'add_contact') {
    const id = Date.now().toString(36);
    await db.query(
      `INSERT INTO contacts (id, name, company, role, email, phone, status, notes, follow_up_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, input.name, input.company||'', input.role||'', input.email||'', input.phone||'',
       input.status||'networking', input.notes||'', input.followUpDate||null]
    );
    return `Added contact: ${input.name}`;
  }
  if (name === 'update_contact') {
    const { rows } = await db.query('SELECT * FROM contacts WHERE id = $1', [input.id]);
    if (!rows.length) return 'Contact not found.';
    await db.query(
      `UPDATE contacts SET name=COALESCE($2,name), company=COALESCE($3,company), role=COALESCE($4,role),
       status=COALESCE($5,status), notes=COALESCE($6,notes), follow_up_date=COALESCE($7,follow_up_date) WHERE id=$1`,
      [input.id, input.name, input.company, input.role, input.status, input.notes, input.followUpDate||null]
    );
    return `Updated ${input.name || rows[0].name}`;
  }
  if (name === 'delete_contact') {
    await db.query('DELETE FROM contacts WHERE id = $1', [input.id]);
    return 'Deleted.';
  }
  if (name === 'remember') {
    await db.query(
      `INSERT INTO stella_memory (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [input.key, input.value]
    );
    return `Got it, I'll always remember: ${input.value}`;
  }
  if (name === 'recall') {
    const { rows } = await db.query('SELECT key, value FROM stella_memory ORDER BY updated_at DESC');
    return rows.length === 0 ? 'No long term memories yet.' : rows.map(r => `${r.key}: ${r.value}`).join('\n');
  }
  if (name === 'forget') {
    await db.query('DELETE FROM stella_memory WHERE key = $1', [input.key]);
    return `Forgot: ${input.key}`;
  }
  if (name === 'send_dashboard') {
    const html = await generateDashboardHTML();
    const filename = `stella-${new Date().toISOString().split('T')[0]}.html`;
    await sendTelegramFile(filename, html, 'Your Stella dashboard — open in browser 🐾');
    return 'Dashboard sent!';
  }
  if (name === 'set_reminder') {
    const dateStr = input.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
    const fireAt = new Date(`${dateStr}T${input.time}:00-06:00`);
    if (isNaN(fireAt.getTime())) return 'Invalid time format.';
    const id = Date.now().toString(36);
    await db.query('INSERT INTO reminders (id, message, fire_at) VALUES ($1, $2, $3)', [id, input.message, fireAt]);
    return `Reminder set for ${fireAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Denver' })}: "${input.message}"`;
  }
  if (name === 'web_search') {
    const apiKey = process.env.SEARCH_API_KEY;
    if (!apiKey) return 'Search API key not configured.';
    const body = JSON.stringify({ q: input.query, num: 5 });
    const result = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: 'google.serper.dev',
        path: '/search',
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ error: d }); } });
      });
      r.on('error', reject);
      r.write(body);
      r.end();
    });
    if (result.error) return `Search failed: ${result.error}`;
    if (!result.organic) return `Search API response: ${JSON.stringify(result).slice(0, 300)}`;
    const organic = result.organic.slice(0, 5);
    const knowledgeGraph = result.knowledgeGraph;
    let out = '';
    if (knowledgeGraph) {
      out += `KNOWLEDGE: ${knowledgeGraph.title} — ${knowledgeGraph.description || ''}\n\n`;
    }
    if (organic.length === 0) return 'No results found.';
    out += organic.map((r, i) =>
      `${i + 1}. ${r.title}\n   ${r.snippet || ''}\n   ${r.link}`
    ).join('\n\n');
    return out;
  }
  return 'Unknown tool.';
}

async function getTelegramImageBase64(fileId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const infoBody = JSON.stringify({ file_id: fileId });
  const fileInfo = await new Promise((resolve, reject) => {
    const r = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/getFile`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(infoBody) },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    r.on('error', reject); r.write(infoBody); r.end();
  });
  const filePath = fileInfo.result.file_path;
  const imgData = await new Promise((resolve, reject) => {
    https.get(`https://api.telegram.org/file/bot${token}/${filePath}`, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
  return imgData.toString('base64');
}

function sanitizeHistory(history) {
  const out = [];
  let lastRole = null;
  for (const msg of history) {
    if (msg.role !== lastRole) { out.push(msg); lastRole = msg.role; }
  }
  while (out.length > 0 && out[0].role !== 'user') out.shift();
  return out;
}

app.get('/api/stella/clear-history', async (req, res) => {
  try {
    await db.query('DELETE FROM stella_history');
    stellaHistory.length = 0;
    res.json({ ok: true, message: 'History cleared — Stella has a fresh start' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200);
  const message = req.body?.message;
  if (!message) return;

  let userContent;

  if (message.photo) {
    const photo = message.photo[message.photo.length - 1];
    try {
      const base64 = await getTelegramImageBase64(photo.file_id);
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
        { type: 'text', text: message.caption || 'What do you see?' },
      ];
    } catch {
      await sendTelegram("Woof, I couldn't load that image 🐾 Try again?");
      return;
    }
  } else if (message.text) {
    userContent = message.text;
  } else {
    return;
  }

  // Store text-only version in DB (never store base64 image data)
  const userContentStr = typeof userContent === 'string'
    ? userContent
    : (userContent.find(b => b.type === 'text')?.text || '[image]');
  stellaHistory.push({ role: 'user', content: userContent });
  if (stellaHistory.length > 30) stellaHistory.splice(0, 2);

  try { await db.query('INSERT INTO stella_history (role, content) VALUES ($1, $2)', ['user', userContentStr]); } catch {}

  try {
    let messages = sanitizeHistory([...stellaHistory]);
    let finalText = '';

    // Agentic loop — let Stella use tools if needed
    for (let i = 0; i < 5; i++) {
      const response = await client.messages.create({
        model: STELLA_MODEL,
        max_tokens: 1024,
        system: await stellaSystemAsync(),
        messages,
        tools: STELLA_TOOLS,
      });

      if (response.stop_reason === 'end_turn') {
        finalText = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
        break;
      }

      if (response.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: response.content });
        const toolResults = await Promise.all(
          response.content
            .filter(b => b.type === 'tool_use')
            .map(async b => ({ type: 'tool_result', tool_use_id: b.id, content: await executeTool(b.name, b.input) }))
        );
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      finalText = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
      break;
    }

    if (finalText) {
      stellaHistory.push({ role: 'assistant', content: finalText });
      try { await db.query('INSERT INTO stella_history (role, content) VALUES ($1, $2)', ['assistant', finalText]); } catch {}
      await sendTelegram(finalText);
    }
  } catch (err) {
    console.error('Stella error:', err.message);
    await sendTelegram(`Woof— something went wrong 🐾\n\nError: ${(err.message || '').slice(0, 150)}`);
  }
});

app.get('/api/telegram/setup-webhook', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = process.env.RENDER_URL || req.query.url;
  if (!baseUrl) return res.status(400).json({ error: 'Set RENDER_URL env var or pass ?url=https://your-app.onrender.com' });

  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`;
  const body = JSON.stringify({ url: webhookUrl });

  const result = await new Promise((resolve, reject) => {
    const r = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/setWebhook`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, resp => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => resolve(JSON.parse(d)));
    });
    r.on('error', reject);
    r.write(body);
    r.end();
  });

  res.json({ webhookUrl, result });
});

app.post('/api/telegram/daily-brief', async (req, res) => {
  const { contacts } = req.body;
  if (!contacts || !contacts.length) {
    return res.status(400).json({ error: 'no contacts provided' });
  }

  const today = new Date().toISOString().split('T')[0];
  const due = contacts.filter(c => c.followUpDate && c.followUpDate <= today);

  let msg = `*Your Daily CRM Brief*\n📅 ${today}\n\n`;
  if (due.length === 0) {
    msg += '✅ No follow-ups due today. Keep it up!';
  } else {
    msg += `*${due.length} follow-up${due.length > 1 ? 's' : ''} due:*\n`;
    due.forEach(c => {
      msg += `\n• *${c.name}*`;
      if (c.company) msg += ` @ ${c.company}`;
      if (c.status) msg += ` — ${c.status}`;
      if (c.notes) msg += `\n  _${c.notes}_`;
    });
  }

  try {
    await sendTelegram(msg);
    res.json({ ok: true, sent: due.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve React frontend in production ──────────────────────────────────────
// COEP/COOP headers are required for SharedArrayBuffer (sql.js + Pyodide WASM)
const fs = require('fs');
const distPath = path.resolve(__dirname, '..', 'dist');

// Diagnostic: visit /api/sage-test to confirm Anthropic API works
app.get('/api/sage-test', async (req, res) => {
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 20,
      messages: [{ role: 'user', content: 'say hi' }],
    });
    res.json({ ok: true, reply: msg.content[0].text, model: MODEL });
  } catch (err) {
    res.json({ ok: false, error: err.message, model: MODEL });
  }
});

// Diagnostic: visit /api/health to confirm build artifacts and API key
app.get('/api/health', (req, res) => {
  const distExists = fs.existsSync(distPath);
  const indexExists = fs.existsSync(path.join(distPath, 'index.html'));
  const contents = distExists ? fs.readdirSync(distPath) : [];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  res.json({
    distPath, distExists, indexExists, contents,
    apiKey: apiKey ? `✓ loaded (starts with ${apiKey.slice(0, 10)}...)` : '✗ MISSING',
  });
});
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`\n🧠 Sage backend running on http://localhost:${PORT}`);
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ loaded' : '✗ missing — set ANTHROPIC_API_KEY in .env'}\n`);
  await initDB();
});
