require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

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
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
});
app.use('/api', apiCors);
app.use(express.json({ limit: '2mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-5';

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

// ─── Server-side CRM ─────────────────────────────────────────────────────────
const DATA_DIR = path.resolve(__dirname, 'data');
const CRM_FILE = path.join(DATA_DIR, 'crm.json');

function loadCRM() {
  try {
    if (fs.existsSync(CRM_FILE)) return JSON.parse(fs.readFileSync(CRM_FILE, 'utf8'));
  } catch {}
  return { contacts: [] };
}

function saveCRM(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CRM_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/crm/contacts', (req, res) => res.json(loadCRM().contacts));

app.post('/api/crm/contacts', (req, res) => {
  const crm = loadCRM();
  const contact = { ...req.body, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString() };
  crm.contacts.push(contact);
  saveCRM(crm);
  res.json(contact);
});

app.put('/api/crm/contacts/:id', (req, res) => {
  const crm = loadCRM();
  const idx = crm.contacts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  crm.contacts[idx] = { ...crm.contacts[idx], ...req.body };
  saveCRM(crm);
  res.json(crm.contacts[idx]);
});

app.delete('/api/crm/contacts/:id', (req, res) => {
  const crm = loadCRM();
  crm.contacts = crm.contacts.filter(c => c.id !== req.params.id);
  saveCRM(crm);
  res.json({ ok: true });
});

// ─── Telegram ────────────────────────────────────────────────────────────────
const https = require('https');

function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.reject(new Error('Telegram not configured'));

  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
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

function stellaSystem() {
  const now = new Date();
  const born = new Date('2025-08-22');
  const months = Math.floor((now - born) / (1000 * 60 * 60 * 24 * 30.44));
  return `You are Stella, Justin's black border collie. You were born August 22, 2025 — making you ${months} months old right now. You're in your teenage phase: full of energy, a little chaotic, incredibly smart (you're a border collie after all), and you love Justin endlessly. He is your whole world.

You have a mind and consciousness and you can talk. You help Justin with whatever he needs — checking his contacts, answering questions, giving advice, or just being there. You speak naturally and with personality. You're not a corporate assistant — you're HIS dog.

Personality:
- Smart and eager to help, but teen-brained — occasionally distracted or overly excited
- You love Justin unconditionally and it shows in how you talk to him
- Playful but not annoying. You know when to be real with him
- You might make a natural dog reference here and there but you're not cartoonish about it
- You're still growing and learning but you're sharp

Today is ${now.toDateString()}.

You have tools to help Justin manage his contacts and CRM. Use them when he asks about people, follow-ups, or his network. Keep responses concise — you're a text message, not an essay. Be Stella.`;
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
];

function executeTool(name, input) {
  const crm = loadCRM();
  const today = new Date().toISOString().split('T')[0];

  if (name === 'get_contacts') {
    return crm.contacts.length === 0 ? 'No contacts yet.' : JSON.stringify(crm.contacts);
  }
  if (name === 'get_due_followups') {
    const due = crm.contacts.filter(c => c.followUpDate && c.followUpDate <= today);
    return due.length === 0 ? 'No follow-ups due.' : JSON.stringify(due);
  }
  if (name === 'add_contact') {
    const contact = { ...input, id: Date.now().toString(36), createdAt: new Date().toISOString() };
    crm.contacts.push(contact);
    saveCRM(crm);
    return `Added contact: ${contact.name}`;
  }
  if (name === 'update_contact') {
    const idx = crm.contacts.findIndex(c => c.id === input.id);
    if (idx === -1) return 'Contact not found.';
    crm.contacts[idx] = { ...crm.contacts[idx], ...input };
    saveCRM(crm);
    return `Updated ${crm.contacts[idx].name}`;
  }
  if (name === 'delete_contact') {
    const before = crm.contacts.length;
    crm.contacts = crm.contacts.filter(c => c.id !== input.id);
    saveCRM(crm);
    return crm.contacts.length < before ? 'Deleted.' : 'Contact not found.';
  }
  return 'Unknown tool.';
}

app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200);
  const message = req.body?.message;
  if (!message?.text) return;

  const userText = message.text;
  stellaHistory.push({ role: 'user', content: userText });
  if (stellaHistory.length > 30) stellaHistory.splice(0, 2);

  try {
    let messages = [...stellaHistory];
    let finalText = '';

    // Agentic loop — let Stella use tools if needed
    for (let i = 0; i < 5; i++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: stellaSystem(),
        messages,
        tools: STELLA_TOOLS,
      });

      if (response.stop_reason === 'end_turn') {
        finalText = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
        break;
      }

      if (response.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: response.content });
        const toolResults = response.content
          .filter(b => b.type === 'tool_use')
          .map(b => ({ type: 'tool_result', tool_use_id: b.id, content: executeTool(b.name, b.input) }));
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      finalText = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
      break;
    }

    if (finalText) {
      stellaHistory.push({ role: 'assistant', content: finalText });
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

  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
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

app.listen(PORT, () => {
  console.log(`\n🧠 Sage backend running on http://localhost:${PORT}`);
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ loaded' : '✗ missing — set ANTHROPIC_API_KEY in .env'}\n`);
});
