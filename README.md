# ZenNotes: Advanced Offline-First Note App

ZenNotes is a production-grade note-taking application built with a focus on reliability, performance, and user experience. It uses an offline-first architecture to ensure users can work seamlessly regardless of their internet connection.

## 🚀 Architecture Overview

### 1. Offline-First Strategy
- **Local Storage**: Uses **IndexedDB** (via **Dexie.js**) as the primary data store. Every change is first committed to the local database.
- **Sync Status**: Each note has a `syncStatus` ('synced' | 'pending'). When a note is modified offline, it's marked as 'pending'.
- **Background Sync**: A custom `useSync` hook monitors the `navigator.onLine` status. When the connection is restored, it automatically pushes all 'pending' changes to the backend.

### 2. Real-Time Synchronization
- **WebSockets**: Uses **Socket.io** for bi-directional communication.
- **Broadcasts**: When a user saves a note, the server broadcasts the change to all other connected clients, ensuring cross-device consistency.
- **Conflict Resolution**: Implements a **Last-Write-Wins (LWW)** strategy using the `updatedAt` timestamp. The version with the most recent timestamp is considered the source of truth.

### 3. Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: 
  - **Local**: IndexedDB (Dexie).
  - **Remote**: MongoDB (Mongoose) - *Demo uses in-memory store fallback*.
- **AI**: Google Gemini API for note summarization.

## ✨ Key Features
- **Rich Text Editor**: Full formatting support (headings, bold, lists, etc.).
- **AI Summarization**: One-click summary generation for long notes.
- **Search & Filter**: Real-time search across titles and content.
- **Dark Mode**: System-aware and toggleable dark UI.
- **PWA Ready**: Designed to be installable and work offline.

## 🛠️ Implementation Guide

### Sync Engine Logic
1. **Local Write**: User edits note -> `db.notes.put(note)` -> `syncStatus = 'pending'`.
2. **Connectivity Check**: `useSync` hook detects `online` event.
3. **Push**: `POST /api/sync` with all pending notes.
4. **Merge**: Server compares `updatedAt` and updates its store.
5. **Pull**: Server returns the latest state; client updates local DB.

### Conflict Resolution
We use a timestamp-based merge. In a real-world production app, you might consider **CRDTs (Conflict-free Replicated Data Types)** or **Operational Transformation (OT)** for character-level collaboration, but LWW is highly effective for document-level sync.

## 📦 Deployment
1. Set `GEMINI_API_KEY` in your environment.
2. Set `MONGODB_URI` for persistent cloud storage.
3. Run `npm run build` and deploy the `dist` folder and `server.ts`.
