import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mock DB for demo if MongoDB is not connected
let notesStore: any[] = [];

// MongoDB Connection (Optional for demo)
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI && mongoose.connection.readyState === 0) {
  mongoose.connect(MONGODB_URI).catch(err => console.error('MongoDB error:', err));
}

// API Routes
app.get('/api/notes', (req, res) => {
  res.json(notesStore);
});

app.post('/api/sync', (req, res) => {
  const { notes: clientNotes } = req.body;
  
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

  res.json({ status: 'ok', notes: notesStore });
});

// Export the app for Vercel
export default app;
