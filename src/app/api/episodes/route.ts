import { NextResponse } from 'next/server';

export interface Episode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  imageUrl: string | null;
  link: string;
}

const RSS_URL = 'https://103fm.maariv.co.il/rss/mediarss.aspx?programId=262';

export async function GET() {
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Radio103App/1.0)' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

    const xml = await res.text();

    // Parse XML with regex (no external deps)
    const items: Episode[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const block = itemMatch[1];

      const get = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
        return m ? (m[1] ?? m[2] ?? '').trim() : '';
      };

      const audioUrl = block.match(/enclosure[^>]+url="([^"]+)"/i)?.[1] ?? '';
      if (!audioUrl) continue;

      const imgRaw = block.match(/<image>([^<]+)<\/image>/i)?.[1] ?? '';

      items.push({
        id: get('guid') || get('link') || audioUrl,
        title: get('title'),
        description: get('description') || get('itunes:subtitle'),
        pubDate: get('pubDate'),
        audioUrl,
        imageUrl: imgRaw || null,
        link: get('link'),
      });
    }

    return NextResponse.json({ episodes: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, episodes: [] }, { status: 500 });
  }
}
