'use client';

import { useState } from 'react';

/**
 * Floating WhatsApp button.
 *
 * Props (all optional):
 *   phone   — number in international format, digits only, no "+" (default: Lisbon number)
 *   message — text pre-filled in the chat when opened
 *   label   — text revealed on hover (desktop only)
 *
 * Usage in app/layout.js (inside <body>, near </body>):
 *   import WhatsAppButton from './WhatsAppButton';
 *   ...
 *   <WhatsAppButton />
 */
export default function WhatsAppButton({
  phone = '351931671204',
  message = "Hi Dmitry, I saw your portfolio and would like to talk about a project.",
  label = "Let's talk",
}) {
  const [hover, setHover] = useState(false);

  const href = `https://wa.me/${phone}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message me on WhatsApp"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed',
        right: '24px',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        zIndex: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        height: '56px',
        padding: hover ? '0 22px 0 0' : '0',
        width: hover ? 'auto' : '56px',
        borderRadius: '28px',
        background: '#000',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
        textDecoration: 'none',
        overflow: 'hidden',
        transform: hover ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 180ms ease, width 220ms ease, padding 220ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          flex: '0 0 56px',
          width: '56px',
          height: '56px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* WhatsApp glyph */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </span>

      <span
        style={{
          whiteSpace: 'nowrap',
          fontSize: '15px',
          fontWeight: 500,
          letterSpacing: '0.01em',
          opacity: hover ? 1 : 0,
          maxWidth: hover ? '160px' : '0px',
          transition: 'opacity 160ms ease, max-width 220ms ease',
        }}
      >
        {label}
      </span>
    </a>
  );
}
