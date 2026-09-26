import { NextResponse } from 'next/server';

export function middleware(request) {
  // Do not apply any auth middleware
  return NextResponse.next();
}

// Empty matcher = middleware doesn't run at all
export const config = {
  matcher: [],
};
