import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get('/api/notes', async (req, res) => {
    try {
      const notesDir = path.join(process.cwd(), 'notes');
      
      // Ensure directory exists
      try {
        await fs.access(notesDir);
      } catch {
        return res.json([]);
      }

      const files = await fs.readdir(notesDir);
      const markdownFiles = files.filter(f => f.endsWith('.md'));

      const notes = await Promise.all(
        markdownFiles.map(async (filename) => {
          const content = await fs.readFile(path.join(notesDir, filename), 'utf-8');
          const stats = await fs.stat(path.join(notesDir, filename));
          return {
            filename,
            content,
            mtime: stats.mtime
          };
        })
      );

      // Sort notes by modification time, descending
      notes.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      res.json(notes);
    } catch (error) {
      console.error('Error reading notes:', error);
      res.status(500).json({ error: 'Failed to read notes' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
