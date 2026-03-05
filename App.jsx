import { useState, useEffect, useCallback } from 'react';
import JournalForm from './components/JournalForm';
import EntryList from './components/EntryList';
import MoodChart from './components/MoodChart';

const STORAGE_KEY = 'folio_journal_entries';

/**
 * App — root component managing:
 * - localStorage persistence (load/save entries)
 * - Toast notifications
 * - Export to JSON
 * - Passing state down to child components
 */
export default function App() {
  const [entries, setEntries] = useState([]);
  const [toast, setToast] = useState(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'entries' | 'chart'

  // Load entries from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load entries from localStorage:', err);
      showToast('Could not load saved entries.', 'error');
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (entries.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      setStorageWarning(false);
    } catch (err) {
      // localStorage full (QuotaExceededError)
      if (err.name === 'QuotaExceededError') {
        setStorageWarning(true);
        showToast('Storage is almost full! Consider exporting and clearing old entries.', 'warning');
      } else {
        console.error('Failed to save entries:', err);
      }
    }
  }, [entries]);

  /**
   * Show a toast notification that auto-dismisses after 3s.
   * Types: 'success' | 'error' | 'warning' | 'info'
   */
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  }, []);

  /** Add a new entry at the beginning of the list */
  const handleSubmit = useCallback((entry) => {
    setEntries((prev) => [entry, ...prev]);
    // Switch to entries tab on mobile after saving
    if (window.innerWidth < 768) {
      setTimeout(() => setActiveTab('entries'), 400);
    }
  }, []);

  /** Remove an entry by ID */
  const handleDelete = useCallback((id) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      // Update localStorage (or clear it if empty)
      if (next.length === 0) localStorage.removeItem(STORAGE_KEY);
      return next;
    });
    showToast('Entry deleted.', 'info');
  }, [showToast]);

  /** Export all entries as a formatted JSON file */
  const handleExport = useCallback(() => {
    if (entries.length === 0) {
      showToast('Nothing to export yet.', 'warning');
      return;
    }

    const exportData = entries.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      text: e.text,
      sentiment: e.sentiment,
      score: e.score,
      emoji: e.emoji,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${entries.length} entries.`, 'success');
  }, [entries, showToast]);

  const toastStyles = {
    success: 'bg-sage-500 text-white',
    error: 'bg-blush-400 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-ink-700 text-ink-100',
  };

  // Mood summary stats
  const moodCounts = entries.reduce(
    (acc, e) => {
      acc[e.sentiment] = (acc[e.sentiment] || 0) + 1;
      return acc;
    },
    { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 }
  );

  return (
    <div className="app min-h-screen">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sage-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blush-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-8 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink-800 tracking-tight">
              Folio
            </h1>
            <p className="font-body text-ink-400 text-sm mt-0.5">
              Your AI-powered mood journal
            </p>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                onClick={handleExport}
                className="export-btn flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-sm transition-all duration-200"
                title="Export all entries as JSON"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {entries.length > 0 && (
          <div className="flex items-center gap-4 mt-4 p-3 bg-ink-50 rounded-xl border border-ink-100 animate-fade-in">
            <span className="font-mono text-xs text-ink-400">{entries.length} entries</span>
            <div className="h-3 w-px bg-ink-200" />
            <span className="font-mono text-xs text-sage-600">😊 {moodCounts.POSITIVE}</span>
            <span className="font-mono text-xs text-ink-400">😐 {moodCounts.NEUTRAL}</span>
            <span className="font-mono text-xs text-blush-400">😔 {moodCounts.NEGATIVE}</span>
            {storageWarning && (
              <>
                <div className="h-3 w-px bg-ink-200" />
                <span className="font-mono text-xs text-amber-500">⚠ Storage full</span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Mobile tab nav */}
      <nav className="relative z-10 px-4 max-w-2xl mx-auto mb-4 md:hidden">
        <div className="flex gap-1 p-1 bg-ink-100 rounded-xl">
          {[
            { id: 'write', label: 'Write' },
            { id: 'entries', label: `Entries${entries.length > 0 ? ` (${entries.length})` : ''}` },
            { id: 'chart', label: 'Mood' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-ink-50 text-ink-800 shadow-sm'
                  : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 px-4 pb-12 max-w-2xl mx-auto">
        {/* Desktop: all sections visible */}
        <div className="hidden md:block space-y-6">
          <JournalForm onSubmit={handleSubmit} onToast={showToast} />

          {entries.length > 0 && (
            <section className="bg-ink-50 rounded-2xl border border-ink-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-display text-lg text-ink-700">Mood Trend</h2>
                <span className="font-mono text-xs text-ink-300 ml-auto">last 7 entries</span>
              </div>
              <MoodChart entries={entries} />
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-lg text-ink-700">Entries</h2>
              <span className="font-mono text-xs text-ink-300 ml-auto">{entries.length} total</span>
            </div>
            <EntryList entries={entries} onDelete={handleDelete} />
          </section>
        </div>

        {/* Mobile: tabbed */}
        <div className="md:hidden">
          {activeTab === 'write' && (
            <div className="animate-slide-up">
              <JournalForm onSubmit={handleSubmit} onToast={showToast} />
            </div>
          )}

          {activeTab === 'entries' && (
            <div className="animate-slide-up">
              <EntryList entries={entries} onDelete={handleDelete} />
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="animate-slide-up">
              <div className="bg-ink-50 rounded-2xl border border-ink-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-display text-lg text-ink-700">Mood Trend</h2>
                  <span className="font-mono text-xs text-ink-300 ml-auto">last 7 entries</span>
                </div>
                <MoodChart entries={entries} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg font-body text-sm max-w-xs ${toastStyles[toast.type]}`}>
            <span>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && '·'}
            </span>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
