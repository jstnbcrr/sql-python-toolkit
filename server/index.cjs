require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
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
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);
const apiCors = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
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
