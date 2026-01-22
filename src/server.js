const express = require('express');
const figlet = require('figlet');

const app = express();

app.use(express.json({ limit: '32kb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

function getTextFromRequest(req) {
  if (req.method === 'GET') {
    return req.query.text;
  }
  return req.body?.text;
}

function getFontFromRequest(req) {
  if (req.method === 'GET') {
    return req.query.font;
  }
  return req.body?.font;
}

function normalizeMultilineText(rawText) {
  const text = rawText.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n');

  const maxLines = 10;
  if (lines.length > maxLines) {
    const err = new Error(`O texto deve ter no máximo ${maxLines} linhas.`);
    err.code = 'too_many_lines';
    throw err;
  }

  const trimmedLines = lines.map((l) => l.trimEnd());
  const maxCharsPerLine = 80;
  for (const line of trimmedLines) {
    if (line.length > maxCharsPerLine) {
      const err = new Error(`Cada linha deve ter no máximo ${maxCharsPerLine} caracteres.`);
      err.code = 'line_too_long';
      throw err;
    }
  }

  const hasAnyContent = trimmedLines.some((l) => l.trim().length > 0);
  if (!hasAnyContent) {
    const err = new Error('Texto vazio.');
    err.code = 'empty_text';
    throw err;
  }

  return trimmedLines;
}

function figletTextAsync(text, options) {
  return new Promise((resolve, reject) => {
    figlet.text(text, options, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

async function renderAsciiMultiline(text, font) {
  const lines = normalizeMultilineText(text);

  const renderedNonEmpty = [];
  for (const line of lines) {
    if (line.trim().length === 0) {
      renderedNonEmpty.push('');
      continue;
    }
    const art = await figletTextAsync(line, { font });
    renderedNonEmpty.push(art.trimEnd());
  }

  return renderedNonEmpty.join('\n\n');
}

app.all('/api/ascii', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.set('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  next();
});

app.get('/api/ascii', (req, res) => {
  const text = getTextFromRequest(req);
  const font = getFontFromRequest(req) || 'Standard';

  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'invalid_text', message: 'Query param "text" é obrigatório.' });
  }

  renderAsciiMultiline(text, font)
    .then((ascii) =>
      res.json({
        text,
        font,
        ascii,
      })
    )
    .catch((err) => {
      const isFontMissing = String(err?.message || '').toLowerCase().includes('font');
      if (err.code === 'too_many_lines') {
        return res.status(400).json({ error: 'too_many_lines', message: err.message });
      }
      if (err.code === 'line_too_long') {
        return res.status(400).json({ error: 'line_too_long', message: err.message });
      }
      if (err.code === 'empty_text') {
        return res.status(400).json({ error: 'invalid_text', message: 'Query param "text" é obrigatório.' });
      }
      return res.status(isFontMissing ? 400 : 500).json({
        error: isFontMissing ? 'invalid_font' : 'figlet_error',
        message: err.message,
      });
    });
});

app.post('/api/ascii', (req, res) => {
  const text = getTextFromRequest(req);
  const font = getFontFromRequest(req) || 'Standard';

  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'invalid_text', message: 'Body field "text" é obrigatório.' });
  }

  renderAsciiMultiline(text, font)
    .then((ascii) =>
      res.json({
        text,
        font,
        ascii,
      })
    )
    .catch((err) => {
      const isFontMissing = String(err?.message || '').toLowerCase().includes('font');
      if (err.code === 'too_many_lines') {
        return res.status(400).json({ error: 'too_many_lines', message: err.message });
      }
      if (err.code === 'line_too_long') {
        return res.status(400).json({ error: 'line_too_long', message: err.message });
      }
      if (err.code === 'empty_text') {
        return res.status(400).json({ error: 'invalid_text', message: 'Body field "text" é obrigatório.' });
      }
      return res.status(isFontMissing ? 400 : 500).json({
        error: isFontMissing ? 'invalid_font' : 'figlet_error',
        message: err.message,
      });
    });
});

app.get('/api/fonts', (req, res) => {
  figlet.fonts((err, fonts) => {
    if (err) {
      return res.status(500).json({ error: 'fonts_error', message: err.message });
    }
    return res.json({ fonts });
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid_json' });
  }
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`ASCII API listening on http://localhost:${port}`);
});
