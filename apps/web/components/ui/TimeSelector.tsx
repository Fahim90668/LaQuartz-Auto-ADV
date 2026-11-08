'use client';

import { Input } from './Input';

export interface TimeSelectorProps {
  totalSeconds: number;
  onChange: (totalSeconds: number) => void;
  minSeconds?: number;
  maxSeconds?: number;
  id?: string;
}

export function TimeSelector({
  totalSeconds,
  onChange,
  minSeconds = 30,
  maxSeconds = 604800,
  id,
}: TimeSelectorProps) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const clamp = (t: number) => Math.max(minSeconds, Math.min(maxSeconds, t));

  const setH = (v: number) => onChange(clamp(v * 3600 + minutes * 60 + seconds));
  const setM = (v: number) => onChange(clamp(hours * 3600 + Math.min(59, v) * 60 + seconds));
  const setS = (v: number) => onChange(clamp(hours * 3600 + minutes * 60 + Math.min(59, v)));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label
            htmlFor={id ? `${id}-h` : undefined}
            className="mb-1 block text-step--2 text-text-tertiary"
          >
            Hours
          </label>
          <Input
            id={id ? `${id}-h` : undefined}
            type="number"
            min={0}
            max={168}
            value={hours}
            onChange={(e) => setH(Math.max(0, Math.min(168, parseInt(e.target.value || '0', 10))))}
            className="text-center font-mono"
          />
        </div>
        <div>
          <label
            htmlFor={id ? `${id}-m` : undefined}
            className="mb-1 block text-step--2 text-text-tertiary"
          >
            Minutes
          </label>
          <Input
            id={id ? `${id}-m` : undefined}
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setM(Math.max(0, parseInt(e.target.value || '0', 10)))}
            className="text-center font-mono"
          />
        </div>
        <div>
          <label
            htmlFor={id ? `${id}-s` : undefined}
            className="mb-1 block text-step--2 text-text-tertiary"
          >
            Seconds
          </label>
          <Input
            id={id ? `${id}-s` : undefined}
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setS(Math.max(0, parseInt(e.target.value || '0', 10)))}
            className="text-center font-mono"
          />
        </div>
      </div>
      <p className="mt-2 text-step--2 text-text-tertiary">
        Total: <span className="font-mono text-text-secondary">{totalSeconds}</span> seconds
        <span className="text-text-disabled"> · </span>
        min {minSeconds}s · max {maxSeconds}s
      </p>
    </div>
  );
    }
