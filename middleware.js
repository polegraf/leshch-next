import { NextResponse } from 'next/server';

// Basic-auth gate for everything under /proto.
// Password comes from the PROTO_PASSWORD env var — never from this file,
// because the repository is public. No env var set = nothing gets through.

const REALM = 'Prototype';

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
  const expected = process.env.PROTO_PASSWORD;
  if (!expected) return unauthorized();

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
  const password = decoded.slice(decoded.indexOf(':') + 1);
  if (password !== expected) return unauthorized();

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/proto', '/proto/:path*'],
};
