'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };
export default function Nav({ seo, onAdminClick, isMobile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    { href: '/', label: 'Works' },
    { href: '/brands-for-sale', label: 'Brands for Sale' },
    { href: '/shop', label: 'Shop' },
    { href: '/photo', label: 'Photo' },
    { href: '/contact', label: 'Contact' },
  ];
  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(0,0,0,.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: `0 ${isMobile ? '20px' : '40px'}`, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '.02em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', ...HN }}>
          {seo?.siteName}
        </Link>
        {isMobile ? (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ display: 'block', width: 22, height: 1.5, background: menuOpen ? 'transparent' : '#fff', transition: 'all .2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: '#fff', transition: 'all .2s', transform: menuOpen ? 'rotate(-45deg)' : 'none' }} />
            {!menuOpen && <span style={{ display: 'block', width: 22, height: 1.5, background: '#fff' }} />}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontSize: 13, cursor: 'pointer', color: pathname === href ? '#fff' : 'rgba(255,255,255,.4)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', transition: 'color .15s', textDecoration: 'none', ...HN }}>
                {label}
              </Link>
            ))}
            <span onClick={onAdminClick} style={{ fontSize: 32, color: '#fff', cursor: 'pointer', fontWeight: 400, lineHeight: 1, userSelect: 'none' }}>✳</span>
          </div>
        )}
      </nav>
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', inset: 0, top: 56, background: '#000', zIndex: 99, display: 'flex', flexDirection: 'column', padding: '48px 20px' }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.1, color: pathname === href ? '#fff' : 'rgba(255,255,255,.35)', cursor: 'pointer', marginBottom: 16, textDecoration: 'none', ...HN }}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
