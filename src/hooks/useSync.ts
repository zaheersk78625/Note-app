import { useEffect, useState, useCallback } from 'react';
import { db as localDb } from '../lib/db';
import { Note } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db as firestoreDb } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth();

  const syncWithBackend = useCallback(async () => {
    if (!navigator.onLine || !user) return;

    try {
      const pendingNotes = await localDb.notes
        .where('syncStatus')
        .equals('pending')
        .and(n => n.userId === user.uid)
        .toArray();
      
      if (pendingNotes.length === 0) return;

      // Sync to Firestore (Real-time backend)
      for (const note of pendingNotes) {
        const noteRef = doc(firestoreDb, 'notes', note.id);
        await setDoc(noteRef, { ...note, syncStatus: 'synced' });
        await localDb.notes.update(note.id, { syncStatus: 'synced' });
      }

      // Also hit the API for any custom backend logic (Vercel Function)
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: pendingNotes, userId: user.uid }),
      });

    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithBackend();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Real-time Firestore Listener (Replaces Socket.io)
    let unsubscribe = () => {};
    if (user) {
      const q = query(collection(firestoreDb, 'notes'), where('userId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const sNote = change.doc.data() as Note;
            localDb.transaction('rw', localDb.notes, async () => {
              const local = await localDb.notes.get(sNote.id);
              if (!local || sNote.updatedAt > local.updatedAt) {
                await localDb.notes.put({ ...sNote, syncStatus: 'synced' });
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [syncWithBackend, user]);

  return { isOnline, syncWithBackend };
}
