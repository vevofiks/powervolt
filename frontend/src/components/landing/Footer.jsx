import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const year = new Date().getFullYear();

  const socials = [
    { label: 'LinkedIn', icon: <><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></> },
    { label: 'Twitter', icon: <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/> },
    { label: 'Facebook', icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/> },
    { label: 'Instagram', icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></> },
  ];

  return (
    <footer style={{ background: '#020617', paddingTop: 96, paddingBottom: 36, position: 'relative', overflow: 'hidden' }}>
      {/* Top separator glow */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(22,163,74,0.4), transparent)',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Main content grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 56,
          marginBottom: 80,
        }}>
          {/* Brand column */}
          <div style={{ gridColumn: 'span 1' }}>
            {/* Logo — exactly same as sidebar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <img
                src="/logo.svg"
                alt="Power Volt Logo"
                style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }}
              />
              <span style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
                Power<span style={{ color: '#4ade80' }}>Volt</span>
              </span>
            </div>

            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.9, marginBottom: 32, maxWidth: 280 }}>
              Leading the way in electrical engineering with innovation, safety, and excellence. Powering your industrial and commercial success since 2009.
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', gap: 10 }}>
              {socials.map(social => (
                <motion.a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  whileHover={{ background: '#16a34a', color: 'white', y: -2 }}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', textDecoration: 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {social.icon}
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 28 }}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['About Us', 'Our Team', 'Careers', 'News & Blog', 'Contact'].map(link => (
                <a key={link} href="#"
                  style={{ color: '#475569', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#4ade80'}
                  onMouseLeave={e => e.target.style.color = '#475569'}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Services links */}
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 28 }}>Services</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Electrical Contracting', 'Industrial Wiring', 'Site Electrical Works', 'Maintenance', 'Equipment Install', 'Product Supply'].map(link => (
                <a key={link} href="#services"
                  style={{ color: '#475569', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#4ade80'}
                  onMouseLeave={e => e.target.style.color = '#475569'}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 28 }}>Contact Us</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                {
                  icon: <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a2 2 0 110-4 2 2 0 010 4z"/>,
                  text: '123 Industrial Way, Tech City, TC 10101',
                },
                {
                  icon: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>,
                  text: '+1 (234) 567-890',
                },
                {
                  icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
                  text: 'contact@powervolt.com',
                },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: 'rgba(22,163,74,0.1)',
                    border: '1px solid rgba(22,163,74,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {item.icon}
                    </svg>
                  </div>
                  <span style={{ color: '#475569', fontSize: 14, lineHeight: 1.65, paddingTop: 6 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: 32,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
        }}>
          {/* Mini logo + copyright */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.svg" alt="Power Volt" style={{ width: 24, height: 24, borderRadius: '50%', opacity: 0.6 }} />
            <p style={{ color: '#334155', fontSize: 13 }}>
              © {year} Power Volt Engineering Services. All rights reserved.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(link => (
              <a key={link} href="#"
                style={{ color: '#334155', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'white'}
                onMouseLeave={e => e.target.style.color = '#334155'}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
