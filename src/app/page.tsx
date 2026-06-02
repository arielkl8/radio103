'use client';
import { useCallback, useEffect, useState } from 'react';
import EpisodeCard from './components/EpisodeCard';
import CompleteEpisodeCard from './components/CompleteEpisodeCard';

interface Episode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  imageUrl: string | null;
  link: string;
}

interface CompleteEpisode {
  id: string;
  title: string;
  date: string;
  embedUrl: string;
  pageUrl: string;
}

type Tab = 'segments' | 'complete';

const REFRESH_INTERVAL = 5 * 60 * 1000;

export default function Home() {
  const [tab, setTab] = useState<Tab>('segments');

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [episodesError, setEpisodesError] = useState<string | null>(null);

  const [complete, setComplete] = useState<CompleteEpisode[]>([]);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeFetched, setCompleteFetched] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadEpisodes = useCallback(async (silent = false) => {
    if (!silent) setEpisodesLoading(true);
    setEpisodesError(null);
    try {
      const res = await fetch('/api/episodes');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEpisodes(data.episodes || []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setEpisodesError(e.message || 'שגיאה בטעינת הקטעים');
    } finally {
      setEpisodesLoading(false);
    }
  }, []);

  const loadComplete = useCallback(async () => {
    setCompleteLoading(true);
    setCompleteError(null);
    try {
      const res = await fetch('/api/complete-episodes');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setComplete(data.episodes || []);
      setCompleteFetched(true);
    } catch (e: any) {
      setCompleteError(e.message || 'שגיאה בטעינת התוכניות המלאות');
    } finally {
      setCompleteLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEpisodes();
    const id = setInterval(() => loadEpisodes(true), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [loadEpisodes]);

  useEffect(() => {
    if (tab === 'complete' && !completeFetched) loadComplete();
  }, [tab, completeFetched, loadComplete]);

  useEffect(() => {
    if (!completeFetched) return;
    const id = setInterval(() => loadComplete(), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [completeFetched, loadComplete]);

  const filteredEpisodes = episodes.filter(
    (ep) => !searchQuery || ep.title.includes(searchQuery) || ep.description.includes(searchQuery)
  );

  const filteredComplete = complete.filter(
    (ep) => !searchQuery || ep.title.includes(searchQuery) || ep.date.includes(searchQuery)
  );

  const grouped = filteredEpisodes.reduce<Record<string, Episode[]>>((acc, ep) => {
    const date = new Date(ep.pubDate).toLocaleDateString('he-IL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(ep);
    return acc;
  }, {});

  const loading = tab === 'segments' ? episodesLoading : completeLoading;
  const error = tab === 'segments' ? episodesError : completeError;

  return (
    <div className="min-h-screen bg-brand-dark text-white" dir="rtl">
      <header className="bg-brand-card border-b border-brand-border sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center text-xl shadow">🎙</div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">ינון מגל ובן כספית</h1>
              <p className="text-gray-400 text-xs mt-0.5">103FM • ראשון–חמישי 09:00–11:00</p>
            </div>
          </div>
          <button
            onClick={() => tab === 'segments' ? loadEpisodes() : loadComplete()}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-brand-border hover:bg-blue-900 px-3 py-1.5 rounded-lg transition"
          >
            🔄 רענן
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-2">
          <button
            onClick={() => { setTab('segments'); setActiveId(null); setSearchQuery(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition
              ${tab === 'segments' ? 'bg-brand-red text-white' : 'bg-brand-border text-gray-400 hover:text-white'}`}
          >קטעים</button>
          <button
            onClick={() => { setTab('complete'); setActiveId(null); setSearchQuery(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition
              ${tab === 'complete' ? 'bg-brand-red text-white' : 'bg-brand-border text-gray-400 hover:text-white'}`}
          >תוכניות מלאות</button>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3">
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-border text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            dir="rtl"
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {lastUpdated && tab === 'segments' && (
          <p className="text-gray-500 text-xs mb-4 text-left">
            עודכן: {lastUpdated.toLocaleTimeString('he-IL')} • {episodes.length} קטעים
          </p>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">טוען...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400 font-semibold mb-2">שגיאה בטעינה</p>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button
              onClick={() => tab === 'segments' ? loadEpisodes() : loadComplete()}
              className="bg-brand-red hover:bg-red-600 px-6 py-2 rounded-lg text-sm font-semibold transition"
            >נסה שוב</button>
          </div>
        )}

        {!loading && !error && tab === 'segments' && (
          Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20 text-gray-500">{searchQuery ? 'לא נמצאו תוצאות' : 'אין קטעים'}</div>
          ) : (
            Object.entries(grouped).map(([date, eps]) => (
              <section key={date} className="mb-8">
                <h2 className="text-gray-300 text-sm font-semibold mb-3 pb-2 border-b border-brand-border">{date}</h2>
                <div className="flex flex-col gap-3">
                  {eps.map((ep) => (
                    <EpisodeCard
                      key={ep.id}
                      episode={ep}
                      isActive={activeId === ep.id}
                      onPlay={() => setActiveId(activeId === ep.id ? null : ep.id)}
                    />
                  ))}
                </div>
              </section>
            ))
          )
        )}

        {!loading && !error && tab === 'complete' && (
          filteredComplete.length === 0 ? (
            <div className="text-center py-20 text-gray-500">{searchQuery ? 'לא נמצאו תוצאות' : 'אין תוכניות מלאות'}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredComplete.map((ep) => (
                <CompleteEpisodeCard
                  key={ep.id}
                  episode={ep}
                  isActive={activeId === ep.id}
                  onPlay={() => setActiveId(activeId === ep.id ? null : ep.id)}
                />
              ))}
            </div>
          )
        )}
      </main>

      <footer className="text-center text-gray-600 text-xs py-6 border-t border-brand-border mt-4">
        מקור: 103FM • מתעדכן אוטומטית כל 5 דקות
      </footer>
    </div>
  );
}
