import React, { useState, useEffect } from 'react';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { useSync } from './hooks/useSync';
import { Wifi, WifiOff, Moon, Sun, Settings, LogOut, User, LayoutGrid, Briefcase, Heart, Lightbulb, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { signInWithGoogle, logout } from './lib/firebase';

const CATEGORIES = [
  { name: 'All', icon: LayoutGrid },
  { name: 'Work', icon: Briefcase },
  { name: 'Personal', icon: Heart },
  { name: 'Ideas', icon: Lightbulb },
];

function MainApp() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const { isOnline } = useSync();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleNewNote = () => {
    setSelectedNoteId(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Settings size={32} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">ZenNotes</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Your thoughts, synced and secure. Offline-first, real-time, and AI-powered.</p>
          
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-16 flex flex-col items-center py-6 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-500/30">
          <Settings size={20} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "p-3 rounded-xl transition-all relative group",
                activeCategory === cat.name 
                  ? "text-blue-600 bg-white dark:bg-zinc-800 shadow-sm" 
                  : "text-zinc-400 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-800"
              )}
              title={cat.name}
            >
              <cat.icon size={20} />
              {activeCategory === cat.name && (
                <motion.div 
                  layoutId="active-cat"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" 
                />
              )}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-4 mt-auto">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
            <img src={user.photoURL || ''} alt={user.displayName || ''} referrerPolicy="no-referrer" />
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 text-zinc-400 hover:text-amber-500 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={logout}
            className="p-3 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Note List */}
      <NoteList 
        onSelectNote={setSelectedNoteId} 
        onNewNote={handleNewNote}
        selectedNoteId={selectedNoteId}
        activeCategory={activeCategory}
      />

      {/* Editor Area */}
      <main className="flex-1 p-6 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
        <div className="absolute top-6 right-10 z-10 flex items-center gap-3">
          <AnimatePresence mode="wait">
            {isOnline ? (
              <motion.div
                key="online"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full border border-green-100 dark:border-green-800"
              >
                <Wifi size={14} /> Online
              </motion.div>
            ) : (
              <motion.div
                key="offline"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-100 dark:border-amber-800"
              >
                <WifiOff size={14} /> Offline Mode
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="max-w-4xl mx-auto h-full">
          <NoteEditor 
            key={selectedNoteId || 'new'} 
            noteId={selectedNoteId} 
            onClose={() => setSelectedNoteId(null)}
          />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
