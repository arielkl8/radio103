'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  audioUrl: string;
  title: string;
  onEnded?: () => void;
}

function formatTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function posKey(url: string) {
  return `audio-pos:${url}`;
}

export default function AudioPlayer({ audioUrl, title, onEnded }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [savedPos, setSavedPos] = useState(0);

  // Reset when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = audioUrl;
    audio.muted = muted;
    setPlaying(false);
    setBuffering(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    const saved = parseFloat(sessionStorage.getItem(posKey(audioUrl)) || '0');
    setSavedPos(isFinite(saved) && saved > 0 ? saved : 0);
  }, [audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savePos = () => {
      if (audio.currentTime > 5 && isFinite(audio.currentTime))
        sessionStorage.setItem(posKey(audioUrl), audio.currentTime.toString());
    };

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      const d = audio.duration;
      setCurrentTime(t);
      if (d && isFinite(d) && d > 0) setProgress((t / d) * 100);
      if (Math.floor(t) % 3 === 0) savePos();
    };

    const onMetadata = () => {
      const d = audio.duration;
      if (d && isFinite(d) && d > 0) {
        setDuration(d);
        // Restore saved position
        const saved = parseFloat(sessionStorage.getItem(posKey(audioUrl)) || '0');
        if (saved > 5 && saved < d - 5) {
          audio.currentTime = saved;
          setSavedPos(saved);
        }
      }
      setBuffering(false);
    };

    const onWaiting = () => setBuffering(true);
    const onPlaying = () => { setPlaying(true); setBuffering(false); };
    const onPause   = () => { setPlaying(false); savePos(); };

    const onEnded2 = () => {
      setPlaying(false);
      setBuffering(false);
      sessionStorage.removeItem(posKey(audioUrl));
      setSavedPos(0);
      onEnded?.();
    };

    const onError = () => {
      setBuffering(false);
      const pos = audio.currentTime;
      const wasPlaying = !audio.paused;
      savePos();
      setTimeout(() => {
        if (!audioRef.current) return;
        audioRef.current.load();
        if (isFinite(pos) && pos > 0) audioRef.current.currentTime = pos;
        if (wasPlaying) audioRef.current.play().catch(() => {});
      }, 3000);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('durationchange', onMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded2);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onMetadata);
      audio.removeEventListener('durationchange', onMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded2);
      audio.removeEventListener('error', onError);
    };
  }, [audioUrl, onEnded]);

  // Play/pause — called directly from onClick (required for iOS gesture policy)
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
    } else {
      setBuffering(true);
      audio.play().catch(() => setBuffering(false));
    }
  };

  // Pointer-based seek — works for mouse drag AND touch drag on iOS/Android
  const calcSeekPct = (clientX: number) => {
    const bar = progressRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const applySeek = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || !isFinite(audio.duration)) return;
    audio.currentTime = pct * audio.duration;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    applySeek(calcSeekPct(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    applySeek(calcSeekPct(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    applySeek(calcSeekPct(e.clientX));
  };

  const skip = (secs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + secs));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  };

  return (
    <div className="bg-[#0d1b2a] border border-brand-border rounded-xl p-4 shadow-lg select-none">
      {/* playsInline prevents iOS from hijacking to fullscreen; x-webkit-airplay for AirPlay */}
      <audio ref={audioRef} preload="metadata" playsInline x-webkit-airplay="allow" />

      <p className="text-white text-sm font-semibold mb-3 text-right truncate" dir="rtl">{title}</p>

      {/* Resume banner */}
      {savedPos > 5 && !playing && currentTime < 5 && (
        <button
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = savedPos;
            audio.play().catch(() => {});
          }}
          className="w-full mb-3 bg-brand-border hover:bg-blue-900 text-gray-300 hover:text-white text-xs rounded-lg py-1.5 px-3 flex items-center justify-center gap-2 transition"
        >
          ↩ המשך מ-{formatTime(savedPos)}
        </button>
      )}

      {/* Progress bar — dir="ltr" forces left→right fill regardless of page RTL */}
      <div
        dir="ltr"
        ref={progressRef}
        className="relative flex items-center cursor-pointer mb-1 touch-none"
        style={{ height: '28px' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Track */}
        <div className="absolute w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-brand-red rounded-full" style={{ width: `${progress}%` }} />
        </div>
        {/* Handle */}
        <div
          className="absolute w-5 h-5 bg-white rounded-full shadow-lg border-2 border-brand-red"
          style={{ left: `calc(${progress}% - 10px)` }}
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-gray-400 mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => skip(-30)}
          className="text-gray-400 active:text-white text-xs transition p-2"
        >
          ⏪ 30s
        </button>

        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-brand-red hover:bg-red-600 active:bg-red-700 flex items-center justify-center text-white shadow-lg transition"
        >
          {buffering
            ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            : playing
              ? <span className="text-2xl leading-none">⏸</span>
              : <span className="text-2xl leading-none pl-0.5">▶</span>
          }
        </button>

        <button
          onClick={() => skip(30)}
          className="text-gray-400 active:text-white text-xs transition p-2"
        >
          30s ⏩
        </button>
      </div>

      {/* Mute button only — volume slider removed */}
      <div className="flex justify-center mt-4">
        <button
          onClick={toggleMute}
          className="text-gray-400 hover:text-white active:text-white transition text-xl p-2"
          title={muted ? 'בטל השתקה' : 'השתק'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}
