import { useState, useRef, useCallback } from 'react';
import { analyzeSentiment } from '../services/huggingface';

/**
 * JournalForm — handles text input, validation, sentiment analysis, and submission.
 * Props:
 *  onSubmit(entry) — called with the new entry object
 *  onToast(msg, type) — shows a toast notification
 */
export default function JournalForm({ onSubmit, onToast }) {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const lastSubmitTime = useRef(0);
  const textareaRef = useRef(null);

  const handleChange = useCallback((e) => {
    setText(e.target.value);
    setCharCount(e.target.value.length);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate: no empty submissions
    if (!text.trim()) {
      onToast('Write something first — your thoughts deserve space.', 'error');
      textareaRef.current?.focus();
      return;
    }

    // Debounce: prevent double-submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < 2000) {
      onToast('Just a moment — saving your last entry.', 'warning');
      return;
    }
    lastSubmitTime.current = now;

    setIsAnalyzing(true);
    onToast('Analyzing your entry...', 'info');

    try {
      // Call HF API (with built-in timeout + rate limit protection)
      const sentiment = await analyzeSentiment(text.trim());

      const entry = {
        id: crypto.randomUUID(),
        text: text.trim(),
        timestamp: new Date().toISOString(),
        sentiment: sentiment.label,
        score: sentiment.score,
        emoji: sentiment.emoji,
      };

      onSubmit(entry);
      setText('');
      setCharCount(0);
      onToast(`Entry saved ${sentiment.emoji}`, 'success');
    } catch (err) {
      console.error('Submit error:', err);
      // Even on error, save with neutral sentiment so no data is lost
      const entry = {
        id: crypto.randomUUID(),
        text: text.trim(),
        timestamp: new Date().toISOString(),
        sentiment: 'NEUTRAL',
        score: 0.5,
        emoji: '😐',
      };
      onSubmit(entry);
      setText('');
      setCharCount(0);
      onToast('Entry saved (sentiment unavailable)', 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, onSubmit, onToast]);

  // Allow Cmd/Ctrl+Enter to submit
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const progress = Math.min((charCount / 500) * 100, 100);

  return (
    <div className="journal-form bg-ink-50 rounded-2xl p-6 border border-ink-100 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-sage-500 animate-pulse-soft" />
        <span className="font-mono text-xs text-ink-400 tracking-widest uppercase">
          New Entry
        </span>
        <span className="ml-auto font-mono text-xs text-ink-300">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric'
          })}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind today? Write freely — this is your space…"
        disabled={isAnalyzing}
        rows={6}
        className="w-full bg-transparent resize-none font-body text-ink-800 placeholder-ink-300 text-base leading-relaxed outline-none border-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />

      {/* Character progress bar */}
      <div className="mt-3 mb-4">
        <div className="h-px bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage-400 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono text-xs text-ink-300 mt-1 block text-right">
          {charCount} chars
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink-300 hidden sm:block">
          ⌘ + Enter to save
        </span>
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || !text.trim()}
          className="submit-btn ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-medium text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <span>Save Entry</span>
              <span className="text-base">✦</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
