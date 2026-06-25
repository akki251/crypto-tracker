import { useRef, useEffect, memo } from 'react';
import { useCandlestick } from '../../hooks/useCandlestick';

interface MiniChartProps {
  symbol: string;
}

export const MiniChart = memo(function MiniChart({ symbol }: MiniChartProps) {
  const candles = useCandlestick(symbol, '1m');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    // Expanded bottom padding for dedicated X-axis bar
    const padding = { top: 20, right: 65, bottom: 28, left: 16 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Deep black background matching reference image
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);

    if (candles.length < 1) return;

    // Find min/max price with slight vertical buffer
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }
    
    const diff = maxPrice - minPrice || 1;
    const buffer = diff * 0.02; // Tighter buffer to make candles look BIG on Y-axis
    minPrice -= buffer;
    maxPrice += buffer;
    const priceRange = maxPrice - minPrice;

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    // ─── Draw Y-Axis (Price) & Horizontal Grid ──────────────────────────────
    const gridRows = 4;
    for (let i = 0; i <= gridRows; i++) {
      const y = padding.top + (i / gridRows) * chartH;
      const priceLevel = maxPrice - (i / gridRows) * priceRange;
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Price label on the right axis
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'left';
      ctx.fillText(priceLevel.toFixed(symbol.includes('DOGE') ? 6 : 2), w - padding.right + 6, y);
    }

    // ─── Draw X-Axis (Time) & Vertical Grid ─────────────────────────────────
    // Separator line above X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const gridCols = 5;
    for (let i = 0; i <= gridCols; i++) {
      const x = padding.left + (i / gridCols) * (chartW - 20);
      const candleIdx = Math.floor((i / gridCols) * (candles.length - 1));
      const targetCandle = candles[candleIdx];

      if (targetCandle) {
        // Vertical Grid line
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, h - padding.bottom);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Time label on bottom axis (including seconds to show 5s differences)
        const timeText = new Date(targetCandle.time * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(timeText, x, h - padding.bottom + 14);
      }
    }

    // Calculate candlestick dimensions
    const displayCount = Math.max(candles.length, 15);
    const candleStep = chartW / displayCount;
    const candleWidth = Math.max(Math.min(candleStep * 0.7, 14), 3);

    // ─── Draw Candlesticks (Wicks and Bodies) ───────────────────────────────
    candles.forEach((c, i) => {
      const x = padding.left + i * candleStep + candleStep / 2;
      const yHigh = padding.top + (1 - (c.high - minPrice) / priceRange) * chartH;
      const yLow = padding.top + (1 - (c.low - minPrice) / priceRange) * chartH;
      const yOpen = padding.top + (1 - (c.open - minPrice) / priceRange) * chartH;
      const yClose = padding.top + (1 - (c.close - minPrice) / priceRange) * chartH;

      const isBullish = c.close >= c.open;
      const color = isBullish ? '#00e676' : '#ff5252';

      // 1. Draw Wick (Shadow)
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Draw Real Body
      const bodyY = Math.min(yOpen, yClose);
      const bodyH = Math.max(Math.abs(yOpen - yClose), 2); // At least 2px for doji
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyH);
    });

    // ─── Draw Active Live Indicators (Price Tag & Time Tag) ─────────────────
    const lastCandle = candles[candles.length - 1];
    if (lastCandle) {
      const lastX = padding.left + (candles.length - 1) * candleStep + candleStep / 2;
      const lastY = padding.top + (1 - (lastCandle.close - minPrice) / priceRange) * chartH;
      const isBullish = lastCandle.close >= lastCandle.open;
      const color = isBullish ? '#00e676' : '#ff5252';

      // Dotted active price line across chart
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(padding.left, lastY);
      ctx.lineTo(w - padding.right, lastY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Pulsing dot on the latest candle
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 1. Price tag on the right Y-axis
      const priceText = lastCandle.close.toFixed(symbol.includes('DOGE') ? 6 : 2);
      ctx.fillStyle = color;
      ctx.fillRect(w - padding.right, lastY - 10, padding.right, 20);

      ctx.fillStyle = '#05070a';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceText, w - padding.right + 6, lastY);

      // 2. Time tag on the bottom X-axis
      const timeText = new Date(lastCandle.time * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      ctx.fillStyle = color;
      ctx.fillRect(lastX - 32, h - padding.bottom + 2, 64, 20);

      ctx.fillStyle = '#05070a';
      ctx.textAlign = 'center';
      ctx.fillText(timeText, lastX, h - padding.bottom + 12);
    }
  }, [candles, symbol]);

  return (
    <div className="mini-chart" id="mini-chart">
      <div className="mini-chart-header">
        <h3>Live Candlestick Chart</h3>
        <span className="mini-chart-period">5s intervals</span>
      </div>
      <div className="mini-chart-canvas-container">
        {candles.length === 0 ? (
          <div className="mini-chart-loading">Collecting candle data…</div>
        ) : (
          <canvas ref={canvasRef} className="mini-chart-canvas" />
        )}
      </div>
    </div>
  );
});

