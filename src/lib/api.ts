// Client-side data fetching via CORS proxy
const PROXY = 'https://api.allorigins.win/raw?url=';

export interface Episode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  imageUrl: string | null;
  link: string;
}

export interface CompleteEpisode {
  id: string;
  title: string;
  date: string;
  embedUrl: string;
  pageUrl: string;
}

export async function fetchEpisodes(): Promise<Episode[]> {
  const target = encodeURIComponent(
    'https://103fm.maariv.co.il/rss/mediarss.aspx?programId=262'
  );
  const res = await fetch(PROXY + target, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = Array.from(doc.querySelectorAll('item'));

  return items
    .filter((item) => item.querySelector('enclosure'))
    .map((item) => ({
      id:
        item.querySelector('guid')?.textContent ||
        item.querySelector('link')?.textContent ||
        Math.random().toString(),
      title: item.querySelector('title')?.textContent || '',
      description:
        item.querySelector('description')?.textContent ||
        item.getElementsByTagNameNS('*', 'subtitle')[0]?.textContent ||
        '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
      audioUrl: item.querySelector('enclosure')?.getAttribute('url') || '',
      imageUrl: item.querySelector('image')?.textContent || null,
      link: item.querySelector('link')?.textContent || '',
    }))
    .filter((ep) => ep.audioUrl);
}

export async function fetchCompleteEpisodes(): Promise<CompleteEpisode[]> {
  const target = encodeURIComponent(
    'https://103fm.maariv.co.il/programs/complete_episodes.aspx?c41t4nzVQ=FJF'
  );
  const res = await fetch(PROXY + target, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Complete episodes fetch failed: ${res.status}`);
  const html = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const links = Array.from(doc.querySelectorAll('a[href*="ZrqvnVq="]'));
  const episodes: CompleteEpisode[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/ZrqvnVq=([A-Z0-9]+)/);
    if (!match) continue;
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);

    // Find the innermost div[dir="rtl"] that contains the date text
    const dateDivs = link.querySelectorAll('div[dir="rtl"]');
    let dateText = '';
    for (const div of Array.from(dateDivs)) {
      const text = div.textContent?.trim() || '';
      if (text.includes('התוכנית המלאה')) {
        dateText = text;
        break;
      }
    }

    episodes.push({
      id,
      title: dateText || 'תוכנית מלאה',
      date: dateText,
      embedUrl: `https://103embed.maariv.co.il/?ZrqvnVq=${id}&c41t4nzVQ=FJF`,
      pageUrl: `https://103fm.maariv.co.il/programs/media.aspx?ZrqvnVq=${id}&c41t4nzVQ=FJF`,
    });
  }

  return episodes;
}
