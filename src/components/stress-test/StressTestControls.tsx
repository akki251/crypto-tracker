import { useState, memo, useCallback } from 'react';
import { HTTP_API_URL, SPEED_PRESETS } from '../../constants';
import type { SpeedPreset, StreamIntervals } from '../../types';

export const StressTestControls = memo(function StressTestControls() {
  const [activePreset, setActivePreset] = useState<SpeedPreset>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = useCallback(async (preset: SpeedPreset) => {
    setLoading(true);
    setError(null);

    try {
      const intervals: StreamIntervals = SPEED_PRESETS[preset];
      const response = await fetch(`${HTTP_API_URL}/intervals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intervals),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setActivePreset(preset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update intervals');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="stress-test" id="stress-test">
      <div className="stress-test-header">
        <h3>⚡ Stress Test</h3>
        <span className="stress-test-subtitle">Update Frequency</span>
      </div>

      <div className="stress-test-buttons">
        {(['normal', 'fast', 'extreme'] as SpeedPreset[]).map((preset) => (
          <button
            key={preset}
            className={`stress-btn ${activePreset === preset ? 'stress-btn-active' : ''} stress-btn-${preset}`}
            onClick={() => applyPreset(preset)}
            disabled={loading}
            id={`stress-${preset}`}
          >
            {preset === 'normal' && '🟢'}
            {preset === 'fast' && '🟡'}
            {preset === 'extreme' && '🔴'}
            {' '}
            {preset.charAt(0).toUpperCase() + preset.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="stress-test-error">⚠ {error}</div>}
      {loading && <div className="stress-test-loading">Updating…</div>}
    </div>
  );
});
