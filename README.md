# Folio — AI-Powered Mood Journal

A beautiful, privacy-first journaling app with AI sentiment analysis powered by Hugging Face.

## ✨ Features

- **AI Sentiment Analysis** — Each entry is analyzed using DistilBERT (SST-2) via Hugging Face Inference API
- **Mood Trend Chart** — Line chart showing your emotional journey across the last 7 entries
- **localStorage Persistence** — All data stays on your device, no backend needed
- **Export to JSON** — Download all entries with sentiment scores
- **Demo Mode** — Works without an API key using keyword-based fallback sentiment
- **Responsive** — Mobile-first design with tabbed navigation on small screens

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up your API key
cp .env.example .env
# Edit .env and add your Hugging Face API key

# 3. Run the dev server
npm run dev
```

## 🔑 Getting a Hugging Face API Key

1. Create a free account at [huggingface.co](https://huggingface.co)
2. Go to **Settings → Access Tokens**
3. Create a token with **"read"** permissions
4. Add it to your `.env` file:
   ```
   VITE_HF_API_KEY=hf_your_token_here
   ```

> **Demo Mode**: If no API key is configured, the app uses keyword-based sentiment analysis so you can still explore all features.

## 📁 Project Structure

```
src/
  components/
    JournalForm.jsx   — Text input, validation, submit with sentiment analysis
    EntryList.jsx     — Entry cards with emoji mood, timestamps, expand/delete
    MoodChart.jsx     — Chart.js line chart for last 7 entries
  services/
    huggingface.js    — HF API wrapper with error handling, timeout, rate limiting
  App.jsx             — Root component, localStorage, state management
  App.css             — Tailwind + custom styles
```

## 🧠 Sentiment Logic

The app uses `distilbert-base-uncased-finetuned-sst-2-english`:

| API Response | Score | Emoji |
|---|---|---|
| POSITIVE | > 0.65 | 😊 |
| NEGATIVE | > 0.65 | 😔 |
| Ambiguous (either < 0.65) | — | 😐 |

- **Timeout**: Requests abort after 5 seconds → fallback to neutral
- **Rate limit**: Min 2 seconds between API calls
- **Storage full**: Warns user when localStorage is near capacity

## 🛠 Tech Stack

- React 18 + Vite
- Tailwind CSS
- Chart.js + react-chartjs-2
- Hugging Face Inference API

## 📦 Build

```bash
npm run build    # Production build to /dist
npm run preview  # Preview production build
```

## 🔒 Privacy

All journal entries are stored exclusively in your browser's `localStorage`. No data is sent to any server except the entry text sent to Hugging Face for sentiment analysis (if API key is configured).
