const path = require('node:path');
const express = require('express');

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
});

module.exports = app;
