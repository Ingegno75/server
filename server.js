import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const app = express();
app.use(express.json());

// CORS semplice
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.post('/parse', async (req, res) => {
  const { url } = req.body;

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    res.json({
      title: article?.title || 'Nessun titolo',
      content: article?.textContent || 'Nessun contenuto'
    });

  } catch (err) {
    res.status(500).json({ error: 'Errore parsing' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server attivo"));