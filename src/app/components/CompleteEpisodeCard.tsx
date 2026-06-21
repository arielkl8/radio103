'use client';
import { useEffect, useState } from 'react';

interface CompleteEpisode {
  id: string;
  title: string;
  date: string;
  embedUrl: string;
}

interface Props {
  episode: CompleteEpisode;
  isActive: boolean;
  onPlay: () => void;
}

export default function CompleteEpisodeCard({ episode, isActive, onPlay }: Props) {
  // Once activated, keep the iframe in the DOM forever so playback isn't interrupted.
  // We only toggle CSS visibility, never unmount.
  const [everActivated, setEverActivated] = useState(false);

  useEffect(() => {
    if (isActive) setEverActivated(true);
  }, [isActive]);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden
        ${isActive
          ? 'border-brand-red bg-brand-card shadow-lg shadow-red-900/20'
          : 'border-brand-border bg-brand-card hover:border-red-800'}`}
      dir="rtl"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onPlay}>
        <div className="w-12 h-12 rounded-lg bg-brand-red/20 border border-brand-red/40 flex items-center justify-center flex-shrink-0 text-xl">
          🎧
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{episode.title}</p>
          <p className="text-gray-400 text-xs mt-0.5">
            {everActivated && !isActive ? '▶ מנגן ברקע — לחץ להצגה' : 'תוכנית מלאה'}
          </p>
        </div>

        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition
          ${isActive
            ? 'bg-brand-red text-white'
            : everActivated
              ? 'bg-green-700 text-white animate-pulse'
              : 'bg-brand-border text-gray-400 hover:bg-red-900 hover:text-white'}`}>
          {isActive ? '🔊' : everActivated ? '🔊' : '▶'}
        </div>
      </div>

      {/* Embedded player — always in DOM once activated, toggled via CSS only */}
      {everActivated && (
        <div className={`px-4 pb-4 ${isActive ? '' : 'hidden'}`}>
          <div className="rounded-lg overflow-hidden border border-brand-border">
            <iframe
              src={episode.embedUrl}
              width="100%"
              height="290"
              scrolling="no"
              frameBorder="0"
              allowTransparency={true}
              allow="autoplay"
              title={episode.title}
              className="block"
            />
          </div>
          <p className="text-gray-500 text-xs mt-2 text-center">
            נגן 103FM המובנה • ניתן לנגן, להשהות ולדלג בתוך הנגן
          </p>
        </div>
      )}
    </div>
  );
}
