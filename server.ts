import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock DB for demo if MongoDB is not connected
let notesStore: any[] = [];

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // MongoDB Connection (Optional for demo)
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.warn('MONGODB_URI not found. Using in-memory store for demo.');
  }

  // API Routes
  app.get('/api/notes', (req, res) => {
    res.json(notesStore);
  });

  app.post('/api/sync', (req, res) => {
    const { notes: clientNotes } = req.body;
    
    // Simple Last-Write-Wins Sync Logic
    clientNotes.forEach((clientNote: any) => {
      const index = notesStore.findIndex(n => n.id === clientNote.id);
      if (index !== -1) {
        if (clientNote.updatedAt > notesStore[index].updatedAt) {
          notesStore[index] = clientNote;
        }
      } else {
        notesStore.push(clientNote);
      }
    });

    // Broadcast changes to other clients
    io.emit('notes_updated', notesStore);
    
    res.json({ status: 'ok', notes: notesStore });
  });

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('sync_note', (note) => {
      const index = notesStore.findIndex(n => n.id === note.id);
      if (index !== -1) {
        notesStore[index] = note;
      } else {
        notesStore.push(note);
      }
      socket.broadcast.emit('note_synced', note);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
