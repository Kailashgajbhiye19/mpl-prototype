import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const app = express();
const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));


/* =========================
   ML UI (Market Literacy Vite Build) - /ml/*
========================= */

app.use('/ml', express.static(path.join(__dirname, 'ml', 'dist')));

app.get('/ml/*ml', (req, res) => {
  res.sendFile(path.join(__dirname, 'ml', 'dist', 'index.html'));
});



// React app for serve static files
app.use('/', express.static(path.join(__dirname, 'build')));

// for all requests
app.get('/*main', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

