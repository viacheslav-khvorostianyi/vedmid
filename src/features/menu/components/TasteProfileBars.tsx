import type { TasteProfile } from '../types';

const LEVELS = [1, 2, 3] as const;

/** Each label with three segments filled up to its value (0–3). */
export default function TasteProfileBars({ profile }: { profile: TasteProfile }) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
      {profile.labels.map((label, i) => {
        const value = profile.values[i] ?? 0;
        return (
          <div key={label} className="contents">
            <dt className="text-[13px]">{label}</dt>
            <dd className="m-0 flex gap-1" aria-label={`${value} з 3`}>
              {LEVELS.map((level) => (
                <span
                  key={level}
                  aria-hidden="true"
                  className={`h-2 w-7 rounded-full ${level <= value ? 'bg-on-green-strong' : 'bg-on-green-strong/20'}`}
                />
              ))}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
