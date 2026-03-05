import { useState } from 'react';

/**
 * EntryList — displays all journal entries with:
 * - Emoji mood indicator based on sentiment
 * - Formatted timestamp
 * - Text preview (truncated to 120 chars, expandable)
 * - Sentiment badge with score
 * - Delete per entry
 */
export default function EntryList({ entries, onDelete }) {
  const [expanded, setExpanded] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (entries.length === 0) {
    return (
      <div className="empty-state text-center py-16 px-6 animate-fade-in">
        <div className="text-5xl mb-4">📖</div>
        <h3 className="font-display text-xl text-ink-600 mb-2">
          Your journal awaits
        </h3>
        <p className="font-body text-ink-400 text-sm leading-relaxed max-w-xs mx-auto">
          Write your first entry above. Each thought you capture is analyzed for
          mood, and your emotional journey is charted over time.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-ink-300">
          <span>😊 Positive</span>
          <span>😐 Neutral</span>
          <span>😔 Negative</span>
        </div>
      </div>
    );
  }

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      onDelete(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const sentimentColor = {
    POSITIVE: 'text-sage-600 bg-sage-400/10 border-sage-400/30',
    NEGATIVE: 'text-blush-500 bg-blush-400/10 border-blush-400/30',
    NEUTRAL: 'text-ink-400 bg-ink-100 border-ink-200',
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <div className="entry-list space-y-3">
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-ink-50 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-ink-100 animate-slide-up">
            <h3 className="font-display text-lg text-ink-800 mb-2">Delete this entry?</h3>
            <p className="font-body text-ink-400 text-sm mb-5">
              This moment will be lost. There's no undo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-ink-200 font-body text-sm text-ink-500 hover:bg-ink-100 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-blush-400 text-white font-body text-sm hover:bg-blush-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {entries.map((entry, index) => {
        const isExpanded = expanded.has(entry.id);
        const preview = entry.text.slice(0, 120);
        const hasMore = entry.text.length > 120;
        const { date, time } = formatDate(entry.timestamp);
        const colorClass = sentimentColor[entry.sentiment] || sentimentColor.NEUTRAL;

        return (
          <div
            key={entry.id}
            className="entry-card bg-ink-50 rounded-xl border border-ink-100 p-4 hover:border-ink-200 transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Emoji mood indicator */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-ink-100 flex items-center justify-center text-xl shadow-sm">
                {entry.emoji}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border ${colorClass}`}>
                    {entry.sentiment}
                    <span className="opacity-60">
                      {Math.round(entry.score * 100)}%
                    </span>
                  </span>
                  <span className="font-mono text-xs text-ink-300">{date}</span>
                  <span className="font-mono text-xs text-ink-300">{time}</span>
                </div>

                {/* Entry text */}
                <p className="font-body text-ink-700 text-sm leading-relaxed">
                  {isExpanded ? entry.text : preview}
                  {!isExpanded && hasMore && (
                    <span className="text-ink-300">…</span>
                  )}
                </p>

                {hasMore && (
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="mt-1.5 font-mono text-xs text-sage-500 hover:text-sage-600 transition-colors"
                  >
                    {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                  </button>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteClick(entry.id)}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-ink-300 hover:text-blush-400 hover:bg-blush-400/10 transition-all duration-150"
                title="Delete entry"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
