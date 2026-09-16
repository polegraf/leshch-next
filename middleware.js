import { NextResponse } from 'next/server';

// Basic-auth gate for everything under /proto.
// Password comes from the PROTO_PASSWORD env var — never from this file,
// because the repository is public.

const REALM = 'Prototype';

function noPassword() {
  // Deliberately not a 401: this says "the deployment has no password
  // configured", which is a different problem from "you typed it wrong".
  return new NextResponse(
    'PROTO_PASSWORD не задан в этом окружении. Добавьте переменную в настройках проекта и передеплойте без кеша сборки.',
    {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  );
}

function unauthorized() {
  return new NextResponse('Нужен пароль', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export function middleware(request) {
  // dj-style (and its sibling preview pages) are public prototype links - no password gate for them.
  const { pathname } = request.nextUrl;
  const PUBLIC_PROTO_PREFIXES = ['/proto/dj-style', '/proto/dj-style-profile', '/proto/dj-style-profile-cards', '/proto/dj-style-profile-collapsed', '/proto/dj-style-profile-interactive'];
  const isPublicProto = PUBLIC_PROTO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
  if (isPublicProto) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // Trim: a value pasted into a dashboard often carries a trailing newline,
  // and an untrimmed compare then fails for a password that looks correct.
  const expected = (process.env.PROTO_PASSWORD || '').trim();
  if (!expected) return noPassword();

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  // Any username is accepted; only the password is checked.
  const password = decoded.slice(decoded.indexOf(':') + 1).trim();
  if (password !== expected) return unauthorized();

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/proto', '/proto/:path*'],
};
