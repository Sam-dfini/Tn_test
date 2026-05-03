export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url');

  if (!target) {
    return new Response('url param required', { status: 400 });
  }

  const ALLOWED_APIS = [
    'api.exchangerate-api.com',
    'api.worldbank.org',
    'www.imf.org',
  ];

  const parsedTarget = new URL(target);
  const isAllowed = ALLOWED_APIS.some(domain =>
    parsedTarget.hostname.includes(domain)
  );

  if (!isAllowed) {
    return new Response('Not allowed', { status: 403 });
  }

  try {
    const response = await fetch(target, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.text();

    return new Response(data, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    return new Response(String(error), { status: 500 });
  }
}
