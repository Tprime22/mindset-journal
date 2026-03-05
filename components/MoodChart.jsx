import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

/**
 * MoodChart — renders a line chart of mood scores for the last 7 entries.
 * Y-axis: 0–1 sentiment score
 * X-axis: entry date/time labels
 * Emoji annotations are shown in custom tooltips
 */
export default function MoodChart({ entries }) {
  // Only use last 7 entries for performance
  const recent = entries.slice(-7);

  if (recent.length < 2) {
    return (
      <div className="mood-chart-empty text-center py-8 px-4">
        <div className="text-3xl mb-2">📈</div>
        <p className="font-body text-ink-400 text-sm">
          Add {2 - recent.length} more {recent.length === 1 ? 'entry' : 'entries'} to see your mood trend.
        </p>
      </div>
    );
  }

  const labels = recent.map((e) => {
    const d = new Date(e.timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      '\n' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  });

  // Normalize score: POSITIVE = score, NEGATIVE = 1 - score, NEUTRAL = 0.5
  // This maps all scores to 0 (negative) → 1 (positive) for the Y axis
  const scores = recent.map((e) => {
    if (e.sentiment === 'POSITIVE') return e.score;
    if (e.sentiment === 'NEGATIVE') return 1 - e.score;
    return 0.5;
  });

  const emojis = recent.map((e) => e.emoji);

  // Dynamic gradient fill based on score values
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const lineColor = avgScore > 0.6 ? '#6d8f66' : avgScore < 0.4 ? '#b8755f' : '#9a8e6e';
  const fillColorStart = avgScore > 0.6 ? 'rgba(109,143,102,0.18)' : avgScore < 0.4 ? 'rgba(184,117,95,0.15)' : 'rgba(154,142,110,0.12)';

  const data = {
    labels,
    datasets: [
      {
        label: 'Mood Score',
        data: scores,
        borderColor: lineColor,
        borderWidth: 2,
        backgroundColor: fillColorStart,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: scores.map((s) =>
          s > 0.6 ? '#6d8f66' : s < 0.4 ? '#b8755f' : '#9a8e6e'
        ),
        pointBorderColor: '#f5f3ee',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1b14',
        titleColor: '#b8ac90',
        bodyColor: '#e8e4d8',
        borderColor: '#322e22',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          // Show emoji + label in tooltip
          title: (items) => {
            const idx = items[0].dataIndex;
            return `${emojis[idx]} ${recent[idx].sentiment}`;
          },
          label: (item) => {
            const score = Math.round(item.raw * 100);
            return `Confidence: ${score}%`;
          },
          afterLabel: (item) => {
            const idx = item.dataIndex;
            const preview = recent[idx].text.slice(0, 50);
            return `"${preview}${recent[idx].text.length > 50 ? '…' : ''}"`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 1,
        grid: {
          color: '#e8e4d8',
          lineWidth: 1,
        },
        border: { dash: [4, 4], display: false },
        ticks: {
          font: { family: "'DM Mono'", size: 10 },
          color: '#b8ac90',
          // Label the Y axis meaningfully
          callback: (val) => {
            if (val === 1) return '😊';
            if (val === 0.5) return '😐';
            if (val === 0) return '😔';
            return '';
          },
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { family: "'DM Mono'", size: 9 },
          color: '#b8ac90',
          maxRotation: 0,
        },
      },
    },
    animation: {
      duration: 600,
      easing: 'easeInOutQuart',
    },
  };

  return (
    <div className="mood-chart" style={{ height: '200px', position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
}
