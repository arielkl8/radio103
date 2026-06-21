'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  audioUrl: string;
  title: string;
  onEnded?: () => void;
}

function formatTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function posKey(url: string) {
  return `audio-pos:${url}`;
}

export default function AudioPlayer({ audioUrl, title, onEnded }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [savedPos, setSavedPos] = useState(0); // last saved position for display

  // Reset when audio URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = audioUrl;
    audio.volume = volume;
    audio.muted = muted;
    setPlaying(false);
    setBuffering(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    // Check for saved position
    const saved = parseFloat(sessionStorage.getItem(posKey(audioUrl)) || '0');
    setSavedPos(saved);
  }, [audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire up audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savePosition = () => {
      if (audio.currentTime > 5) {
        sessionStorage.setItem(posKey(audioUrl), audio.currentTime.toString());
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
      // Save position every ~3s (fires ~4x/sec, modulo keeps it cheap)
      if (Math.floor(audio.currentTime) % 3 === 0) savePosition();
    };

    const onLoaded = () => {
      setDuration(audio.duration);
      setBuffering(false);
      // Restore saved position
      const saved = parseFloat(sessionStorage.getItem(posKey(audioUrl)) || '0');
      if (saved > 5 && saved < audio.duration - 5) {
        audio.currentTime = saved;
        setSavedPos(saved);
      }
    };

    const onWaiting = () => setBuffering(true);
    const onPlaying = () => { setPlaying(true); setBuffering(false); };
    const onPause = () => { setPlaying(false); savePosition(); };

    const onEnded2 = () => {
      setPlaying(false);
      setBuffering(false);
      sessionStorage.removeItem(posKey(audioUrl));
      setSavedPos(0);
      onEnded?.();
    };

    const onError = () => {
      setBuffering(false);
      // Auto-retry: save current position and reload
      const pos = audio.currentTime;
      const wasPlaying = !audio.paused;
      savePosition();
      setTimeout(() => {
        if (!audioRef.current) return;
        audioRef.current.load();
        audioRef.current.currentTime = pos;
        if (wasPlaying) audioRef.current.play().catch(() => {});
      }, 3000);
    };

    const onStalled = () => {
      setBuffering(true);
      // If stalled for more than 8s, reload from current position
      const pos = audio.currentTime;
      const wasPlaying = !audio.paused;
      const timer = setTimeout(() => {
        if (!audioRef.current || audioRef.current.readyState >= 3) return;
        audioRef.current.load();
        audioRef.current.currentTime = pos;
        if (wasPlaying) audioRef.current.play().catch(() => {});
      }, 8000);
      return () => clearTimeout(timer);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded2);
    audio.addEventListener('error', onError);
    audio.addEventListener('stalled', onStalled);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded2);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('stalled', onStalled);
    };
  }, [audioUrl, onEnded]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
    } else {
      setBuffering(true);
      try {
        await audio.play();
      } catch {
        setBuffering(false);
      }
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(audio.duration, pct * audio.duration));
  };

  const skip = (secs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + secs));
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      if (v > 0 && muted) { audioRef.current.muted = false; setMuted(false); }
    }
  };

  const resumeFromSaved = () => {
    const audio = audioRef.current;
    if (!audio || !savedPos) return;
    audio.currentTime = savedPos;
    audio.play().catch(() => {});
  };

  return (
    <div className="bg-[#0d1b2a] border border-brand-border rounded-xl p-4 shadow-lg">
      <audio ref={audioRef} preload="metadata" />

      <p className="text-white text-sm font-semibold mb-3 text-right truncate" dir="rtl">{title}</p>

      {/* Resume from saved position banner */}
      {savedPos > 5 && !playing && currentTime < 5 && (
        <button
          onClick={resumeFromSaved}
          className="w-full mb-3 bg-brand-border hover:bg-blue-900 text-gray-300 hover:text-white text-xs rounded-lg py-1.5 px-3 flex items-center justify-center gap-2 transition"
        >
          ↩ המשך מ-{formatTime(savedPos)}
        </button>
      )}

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-700 rounded-full cursor-pointer mb-2 group" onClick={seek}>
        <div className="h-full bg-brand-red rounded-full" style={{ width: `${progress}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Time */}
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5">
        <button onClick={() => skip(-30)} className="text-gray-400 hover:text-white text-xs transition" title="30 שניות אחורה">
          ⏪ 30s
        </button>
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-brand-red hover:bg-red-600 flex items-center justify-center text-white text-xl shadow transition"
        >
          {buffering
            ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            : playing
              ? <span className="text-2xl leading-none">⏸</span>
              : <span className="text-2xl leading-none">▶</span>
          }
        </button>
        <button onClick={() => skip(30)} className="text-gray-400 hover:text-white text-xs transition" title="30 שניות קדימה">
          30s ⏩
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={toggleMute}
          className="text-gray-400 hover:text-white transition text-base w-6 text-center flex-shrink-0"
          title={muted ? 'בטל השתקה' : 'השתק'}
        >
          {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        <input
          type="range" min={0} max={1} step={0.02}
          value={muted ? 0 : volume}
          onChange={changeVolume}
          className="flex-1 h-1 accent-red-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
