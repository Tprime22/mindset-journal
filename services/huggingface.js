/**
 * Hugging Face Sentiment Analysis Service
 * Model: distilbert-base-uncased-finetuned-sst-2-english
 *
 * This wrapper handles:
 * - API calls with timeout protection (5s max)
 * - Rate limiting (min 2s between calls)
 * - Graceful fallback to NEUTRAL on any failure
 * - Sentiment score normalization
 */

const HF_API_URL =
  'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english';

// Rate limiting: track last call timestamp
let lastCallTime = 0;
const MIN_CALL_INTERVAL_MS = 2000;

/**
 * Maps raw HF API response to a normalized sentiment result.
 * The model returns an array of [{label, score}] pairs.
 *
 * Mapping logic:
 *  - POSITIVE with score > 0.5  → 😊 positive
 *  - NEGATIVE with score >= 0.5 → 😔 negative
 *  - Anything ambiguous (score near 0.5) → 😐 neutral
 *
 * @param {Array} results - Raw API response array
 * @returns {{ label: string, score: number, emoji: string }}
 */
function parseHFResponse(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return { label: 'NEUTRAL', score: 0.5, emoji: '😐' };
  }

  // HF returns an array of arrays; flatten if needed
  const items = Array.isArray(results[0]) ? results[0] : results;

  // Find the highest-scoring label
  const top = items.reduce((best, curr) =>
    curr.score > best.score ? curr : best
  );

  const label = top.label.toUpperCase();
  const score = top.score;

  // Apply neutral band: if confidence is low, call it neutral
  // POSITIVE → emoji based on score threshold
  if (label === 'POSITIVE') {
    if (score > 0.65) return { label: 'POSITIVE', score, emoji: '😊' };
    return { label: 'NEUTRAL', score: 0.5, emoji: '😐' };
  }

  // NEGATIVE → emoji based on score threshold
  if (label === 'NEGATIVE') {
    if (score > 0.65) return { label: 'NEGATIVE', score, emoji: '😔' };
    return { label: 'NEUTRAL', score: 0.5, emoji: '😐' };
  }

  return { label: 'NEUTRAL', score: 0.5, emoji: '😐' };
}

/**
 * Analyzes sentiment of a given text using Hugging Face Inference API.
 * Enforces a 5-second timeout and 2-second rate limit between calls.
 *
 * @param {string} text - The journal entry text to analyze
 * @returns {Promise<{ label: string, score: number, emoji: string }>}
 */
export async function analyzeSentiment(text) {
  // Fallback result used on any error
  const fallback = { label: 'NEUTRAL', score: 0.5, emoji: '😐' };

  if (!text || text.trim().length === 0) return fallback;

  // Rate limit enforcement: wait if called too soon
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_CALL_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_CALL_INTERVAL_MS - elapsed));
  }
  lastCallTime = Date.now();

  const apiKey = VITE_HF_API_KEY=hf_your_token_here'';

  // If no API key is configured, return a mock sentiment based on text length
  // This allows the app to function in demo mode
  if (!apiKey || apiKey === 'hf_your_api_key_here') {
    console.warn('[HF] No API key found. Using demo sentiment mode.');
    return getDemoSentiment(text);
  }

  // Set up AbortController for 5-second timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // Handle model loading (503) gracefully
      if (response.status === 503) {
        console.warn('[HF] Model loading, falling back to neutral sentiment.');
        return fallback;
      }
      throw new Error(`HF API error: ${response.status}`);
    }

    const data = await response.json();
    return parseHFResponse(data);
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      console.warn('[HF] Request timed out (>5s). Using neutral fallback.');
    } else {
      console.error('[HF] Sentiment analysis failed:', err.message);
    }

    return fallback;
  }
}

/**
 * Demo/fallback sentiment: crude keyword-based analysis
 * Used when no API key is configured, so the UI still works.
 * @param {string} text
 */
function getDemoSentiment(text) {
  const lower = text.toLowerCase();
  const positiveWords = ['happy', 'great', 'love', 'wonderful', 'good', 'excited', 'joy', 'amazing', 'fantastic', 'blessed', 'grateful', 'smile', 'laugh', 'peaceful', 'inspired'];
  const negativeWords = ['sad', 'terrible', 'hate', 'awful', 'bad', 'angry', 'upset', 'depressed', 'anxious', 'worried', 'stressed', 'failed', 'lost', 'alone', 'hurt'];

  const posCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (posCount > negCount) {
    const score = 0.7 + Math.min(posCount * 0.05, 0.25);
    return { label: 'POSITIVE', score, emoji: '😊' };
  } else if (negCount > posCount) {
    const score = 0.7 + Math.min(negCount * 0.05, 0.25);
    return { label: 'NEGATIVE', score, emoji: '😔' };
  }

  return { label: 'NEUTRAL', score: 0.5, emoji: '😐' };
}
