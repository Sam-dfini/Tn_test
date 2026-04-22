export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const feedUrl = url.searchParams.get('url');

  if (!feedUrl) {
    return new Response(JSON.stringify({ error: 'url param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate URL is one of our allowed sources
  const ALLOWED_DOMAINS = [
    'nawaat.org',
    'inkyfada.com',
    'businessnews.com.tn',
    'kapitalis.com',
    'tap.info.tn',
    'reuters.com',
    'mosaiquefm.net',
    'shemsfm.net',
    'leaders.com.tn',
    'webmanagercenter.com',
    'huffpostmaghreb.com',
    'jeuneafrique.com',
    'middleeasteye.net',
    'google.com',
    'news.google.com',
  ];

  const parsedFeedUrl = new URL(feedUrl);
  const isAllowed = ALLOWED_DOMAINS.some(domain =>
    parsedFeedUrl.hostname.includes(domain)
  );

  if (!isAllowed) {
    return new Response(
      JSON.stringify({ error: 'Domain not in allowlist' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/atom+xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(8000),
    });

    const xml = await response.text();

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=300', // 5 min cache
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Fetch failed', details: String(error) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
