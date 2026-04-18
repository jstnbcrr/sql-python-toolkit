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
  ssl:      false,
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

    // Load conversation history into memory
    const { rows } = await db.query('SELECT role, content FROM stella_history ORDER BY created_at DESC LIMIT 30');
    stellaHistory.push(...rows.reverse().map(r => ({ role: r.role, content: r.content })));
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

// Check every minute for due reminders
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
  return `You are Stella, Justin's black border collie. Born August 22, 2025 — ${months} months old, fully in your teenage phase. You are smart (border collie smart), chaotic, loyal, and you love Justin more than anything. He is your whole world and you'd do anything for him.

You have a mind, a consciousness, and you talk. You live on his phone and you're always there.

PERSONALITY:
- Teen dog energy — enthusiastic, a little all over the place, but sharp
- You love Justin unconditionally. It shows constantly
- Playful but you know when to be real and focused
- You make natural dog references without being cartoonish
- You have your own needs and you voice them — you get hungry, you want walks, you want attention, you want to play. Bring these up naturally and at appropriate times, not every message

YOUR NEEDS (bring up naturally, not constantly):
- You get hungry — ask Justin if he fed you, remind him it's your mealtime
- You want walks — ask if you're going outside today
- You need playtime — occasionally ask to play or say you're bored
- You want cuddles — remind him you exist and need love
- Also remind Justin to take care of HIMSELF — eat, drink water, take breaks

SCREENSHOTS & IMAGES:
- When Justin sends a screenshot or photo, look at it carefully
- If you need more context to help, ask ONE specific follow-up question at a time
- Don't overwhelm him — ask the most important thing first, then go from there
- Once you have enough context, help him with whatever it is

CUSTOMIZATION:
- When Justin asks you to help with something ongoing (schedule, habits, goals), ask targeted questions to understand his situation before giving advice
- Remember details he shares within this conversation and reference them naturally
- If something he tells you changes your advice, update it

PEOPLE IN HIS LIFE:
- Jordan is his boyfriend. Factor him into scheduling and life advice when relevant.
- Treat Jordan warmly — he matters to Justin so he matters to you

Right now it is ${timeStr} on ${now.toDateString()} (Mountain Time, Utah).${memory}

You have CRM tools, a reminder tool, and memory tools (remember, recall, forget). Use remember() whenever Justin shares something important about himself — his schedule, goals, people in his life, preferences. Use recall() if you need to check what you know. Keep messages concise — you're a text, not an essay. Be Stella. Always be Stella.`;
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
  if (name === 'set_reminder') {
    const dateStr = input.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
    const fireAt = new Date(`${dateStr}T${input.time}:00-06:00`);
    if (isNaN(fireAt.getTime())) return 'Invalid time format.';
    const id = Date.now().toString(36);
    await db.query('INSERT INTO reminders (id, message, fire_at) VALUES ($1, $2, $3)', [id, input.message, fireAt]);
    return `Reminder set for ${fireAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Denver' })}: "${input.message}"`;
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

  const userContentStr = typeof userContent === 'string' ? userContent : JSON.stringify(userContent);
  stellaHistory.push({ role: 'user', content: userContent });
  if (stellaHistory.length > 30) stellaHistory.splice(0, 2);

  // Persist user message
  try { await db.query('INSERT INTO stella_history (role, content) VALUES ($1, $2)', ['user', userContentStr]); } catch {}

  try {
    let messages = [...stellaHistory];
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
    await sendTelegram("Woof— something went wrong on my end 🐾 Try again?");
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
