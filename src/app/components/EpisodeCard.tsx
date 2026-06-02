'use client';
import { useState } from 'react';
import AudioPlayer from './AudioPlayer';

interface Episode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  imageUrl: string | null;
  link: string;
}

interface Props {
  episode: Episode;
  isActive: boolean;
  onPlay: () => void;
}

function formatDate(pubDate: string) {
  try {
    const d = new Date(pubDate);
    return d.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return pubDate;
  }
}

export default function EpisodeCard({ episode, isActive, onPlay }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden
        ${isActive ? 'border-brand-red bg-brand-card shadow-red-900/30 shadow-lg' : 'border-brand-border bg-brand-card hover:border-red-800'}`}
      dir="rtl"
    >
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => { onPlay(); setExpanded(true); }}>
        {/* Thumbnail */}
        {episode.imageUrl ? (
          <img
            src={episode.imageUrl}
            alt=""
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-brand-border flex items-center justify-center flex-shrink-0 text-2xl">
            🎙️
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{episode.title}</p>
          <p className="text-gray-400 text-xs mt-1">{formatDate(episode.pubDate)}</p>
          {episode.description && (
            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{episode.description}</p>
          )}
        </div>

        {/* Play indicator */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition
          ${isActive ? 'bg-brand-red text-white' : 'bg-brand-border text-gray-400 hover:bg-red-900 hover:text-white'}`}>
          {isActive ? '🔊' : '▶'}
        </div>
      </div>

      {/* Expanded player */}
      {isActive && (
        <div className="px-4 pb-4">
          <AudioPlayer audioUrl={episode.audioUrl} title={episode.title} />
        </div>
      )}
    </div>
  );
}
