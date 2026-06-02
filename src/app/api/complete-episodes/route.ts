import { NextResponse } from 'next/server';

export interface CompleteEpisode {
  id: string;
  title: string;
  date: string;
  embedUrl: string;
  pageUrl: string;
}

const COMPLETE_URL = 'https://103fm.maariv.co.il/programs/complete_episodes.aspx?c41t4nzVQ=FJF';

export async function GET() {
  try {
    const res = await fetch(COMPLETE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Radio103App/1.0)' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const html = await res.text();

    const blockRegex = /ZrqvnVq=([A-Z0-9]+)&c41t4nzVQ=FJF[\s\S]*?<div[^>]+dir="rtl">\s*(התוכנית המלאה[^<]*)<\/div>/gi;
    const episodes: CompleteEpisode[] = [];
    const seen = new Set<string>();

    let match;
    while ((match = blockRegex.exec(html)) !== null) {
      const id = match[1];
      if (seen.has(id)) continue;
      seen.add(id);
      const dateText = match[2].trim();
      episodes.push({
        id,
        title: dateText || 'תוכנית מלאה',
        date: dateText,
        embedUrl: `https://103embed.maariv.co.il/?ZrqvnVq=${id}&c41t4nzVQ=FJF`,
        pageUrl: `https://103fm.maariv.co.il/programs/media.aspx?ZrqvnVq=${id}&c41t4nzVQ=FJF`,
      });
    }

    return NextResponse.json({ episodes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, episodes: [] }, { status: 500 });
  }
}
