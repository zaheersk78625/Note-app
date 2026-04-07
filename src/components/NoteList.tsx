import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { format } from 'date-fns';
import { Search, Plus, FileText, Tag as TagIcon, Pin } from 'lucide-react';
import { Note } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NoteListProps {
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  selectedNoteId: string | null;
  activeCategory: string;
}

export default function NoteList({ onSelectNote, onNewNote, selectedNoteId, activeCategory }: NoteListProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const notes = useLiveQuery(
    async () => {
      if (!user) return [];
      const allNotes = await db.notes.where('userId').equals(user.uid).toArray();
      
      // Sort: Pinned first, then by updatedAt
      const sortedNotes = allNotes.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });

      return sortedNotes.filter(n => {
        const matchesSearch = !searchQuery || 
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = activeCategory === 'All' || n.category === activeCategory;
        
        return matchesSearch && matchesCategory;
      });
    },
    [searchQuery, activeCategory, user]
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 w-80 shrink-0">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold dark:text-white">ZenNotes</h1>
          <button
            onClick={onNewNote}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {notes?.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`w-full text-left p-3 rounded-xl transition-all group relative ${
              selectedNoteId === note.id
                ? 'bg-white dark:bg-zinc-800 shadow-md border-zinc-200 dark:border-zinc-700'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border-transparent'
            } border`}
          >
            {note.isPinned && (
              <div className="absolute top-2 right-2 text-amber-500">
                <Pin size={12} fill="currentColor" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedNoteId === note.id ? 'bg-blue-50 text-blue-600' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}>
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {note.title || 'Untitled Note'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                  {note.content.replace(/<[^>]*>/g, '') || 'No content...'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-zinc-400">
                    {format(note.updatedAt, 'MMM d')}
                  </span>
                  {note.category && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md">
                      <TagIcon size={10} />
                      {note.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
        {notes?.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-sm">No notes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
