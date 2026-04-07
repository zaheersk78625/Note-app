import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Note } from '../types';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { summarizeNote } from '../lib/gemini';
import { Sparkles, Save, Trash2, Tag, Clock, Mic, MicOff, Pin, PinOff } from 'lucide-react';
import { format } from 'date-fns';
import { socket } from '../lib/socket';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export default function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const { user } = useAuth();
  const [note, setNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    tags: [],
    category: 'General',
    isPinned: false,
  });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (noteId) {
      db.notes.get(noteId).then((existingNote) => {
        if (existingNote) setNote(existingNote);
      });
    } else if (user) {
      setNote({
        id: uuidv4(),
        title: '',
        content: '',
        tags: [],
        category: 'General',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'pending',
        version: 1,
        isPinned: false,
        userId: user.uid,
      });
    }
  }, [noteId, user]);

  const handleSave = async () => {
    if (!note.id) return;
    
    const updatedNote = {
      ...note,
      updatedAt: Date.now(),
      syncStatus: 'pending' as const,
    } as Note;

    await db.notes.put(updatedNote);
    socket.emit('sync_note', updatedNote);
    onClose();
  };

  const handleTogglePin = () => {
    setNote(prev => ({ ...prev, isPinned: !prev.isPinned }));
  };

  const handleSummarize = async () => {
    if (!note.content) return;
    setIsSummarizing(true);
    try {
      const text = await summarizeNote(note.content);
      setSummary(text || 'Could not summarize.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      setNote(prev => ({ ...prev, content: prev.content + ' ' + transcript }));
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={handleTogglePin}
            className={cn(
              "p-2 rounded-lg transition-colors",
              note.isPinned ? "text-amber-500 bg-amber-50" : "text-zinc-400 hover:bg-zinc-100"
            )}
          >
            {note.isPinned ? <Pin size={20} fill="currentColor" /> : <Pin size={20} />}
          </button>
          <input
            type="text"
            value={note.title}
            onChange={(e) => setNote({ ...note, title: e.target.value })}
            placeholder="Note Title"
            className="text-xl font-bold bg-transparent border-none focus:ring-0 w-full dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isListening ? "text-red-500 bg-red-50 animate-pulse" : "text-zinc-400 hover:bg-zinc-100"
            )}
            title="Voice to Text"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            title="AI Summarize"
          >
            <Sparkles size={20} className={isSummarizing ? 'animate-pulse' : ''} />
          </button>
          <button
            onClick={handleSave}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Save"
          >
            <Save size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ReactQuill
          theme="snow"
          value={note.content}
          onChange={(content) => setNote({ ...note, content })}
          className="h-[calc(100%-100px)] mb-12 dark:text-zinc-200"
          modules={{
            toolbar: [
              [{ header: [1, 2, false] }],
              ['bold', 'italic', 'underline', 'strike', 'blockquote'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'clean'],
            ],
          }}
        />

        {summary && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
              <Sparkles size={14} /> AI Summary
            </h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">{summary}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          {note.updatedAt ? format(note.updatedAt, 'MMM d, h:mm a') : 'Not saved'}
        </div>
        <div className="flex items-center gap-1">
          <Tag size={14} />
          {note.category}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={cn(
            "w-2 h-2 rounded-full",
            note.syncStatus === 'synced' ? 'bg-green-500' : 'bg-amber-500'
          )} />
          {note.syncStatus === 'synced' ? 'Synced' : 'Offline'}
        </div>
      </div>
    </div>
  );
}
