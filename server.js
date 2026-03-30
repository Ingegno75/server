import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// cache semplice in memoria
const cache = new Map();

app.post('/parse', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL mancante' });
  }

  // 🔥 CACHE
  if (cache.has(url)) {
    console.log("CACHE HIT");
    return res.json(cache.get(url));
  }

  try {
    console.log("FETCH:", url);

    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      },
      maxContentLength: 2 * 1024 * 1024 // 2MB
    });

    let html = response.data;

    // 🔥 rimuove script e style (velocizza parsing)
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    let content = article?.content || '<p>Nessun contenuto</p>';

// rimuove attributi inutili ma mantiene link
content = content.replace(/style="[^"]*"/g, '');
content = content.replace(/class="[^"]*"/g, '');
content = content.replace(/id="[^"]*"/g, '');

const result = {
  title: article?.title || 'Nessun titolo',
  content: content
};

    // 🔥 salva in cache
    cache.set(url, result);

    res.json(result);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Errore parsing pagina' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server ottimizzato attivo su porta " + PORT));