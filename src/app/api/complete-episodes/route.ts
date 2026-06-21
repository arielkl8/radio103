import { NextResponse } from 'next/server';

export interface CompleteEpisode {
  id: string;
  title: string;
  date: string;
  audioUrl: string;
  pageUrl: string;
}

const COMPLETE_URL = 'https://103fm.maariv.co.il/programs/complete_episodes.aspx?c41t4nzVQ=FJF';
const EMBED_BASE = 'https://103embed.maariv.co.il/?ZrqvnVq=';
const AUDIO_BASE = 'https://awaod01.streamgates.net/103fm_aw/';

async function getAudioUrl(id: string): Promise<string> {
  try {
    const res = await fetch(`${EMBED_BASE}${id}&c41t4nzVQ=FJF`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Radio103App/1.0)' },
    });
    if (!res.ok) return '';
    const html = await res.text();
    const match = html.match(/data-file="([^"]+)"/);
    if (!match) return '';
    return `${AUDIO_BASE}${match[1]}.mp3`;
  } catch {
    return '';
  }
}

export async function GET() {
  try {
    const res = await fetch(COMPLETE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Radio103App/1.0)' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const html = await res.text();

    const blockRegex = /ZrqvnVq=([A-Z0-9]+)&c41t4nzVQ=FJF[\s\S]*?<div[^>]+dir="rtl">\s*(התוכנית המלאה[^<]*)<\/div>/gi;
    const items: { id: string; title: string; date: string }[] = [];
    const seen = new Set<string>();

    let match;
    while ((match = blockRegex.exec(html)) !== null) {
      const id = match[1];
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({ id, title: match[2].trim() || 'תוכנית מלאה', date: match[2].trim() });
    }

    // Fetch audio URLs in parallel (limit to 10 most recent)
    const recent = items.slice(0, 10);
    const audioUrls = await Promise.all(recent.map((ep) => getAudioUrl(ep.id)));

    const episodes: CompleteEpisode[] = recent.map((ep, i) => ({
      id: ep.id,
      title: ep.title,
      date: ep.date,
      audioUrl: audioUrls[i],
      pageUrl: `https://103fm.maariv.co.il/programs/media.aspx?ZrqvnVq=${ep.id}&c41t4nzVQ=FJF`,
    }));

    return NextResponse.json({ episodes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, episodes: [] }, { status: 500 });
  }
}
