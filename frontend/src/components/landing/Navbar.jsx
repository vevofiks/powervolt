import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const brandTextColor = isScrolled ? '#0a0f1e' : 'white';

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.35s ease',
        background: isScrolled ? 'rgba(255,255,255,0.88)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        boxShadow: isScrolled ? '0 2px 40px rgba(0,0,0,0.08)' : 'none',
        padding: isScrolled ? '12px 0' : '20px 0',
      }}
    >
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Logo */}
        <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <img
            src="/logo.svg"
            alt="Power Volt Logo"
            style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }}
          />
          <span style={{
            fontSize: 20,
            fontWeight: 900,
            color: brandTextColor,
            letterSpacing: '-0.5px',
            transition: 'color 0.3s ease',
          }}>
            Power<span style={{ color: '#16a34a' }}>Volt</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="pv-desktop-nav">
          {navLinks.map(link => (
            <a
              key={link.name}
              href={link.href}
              style={{
                fontSize: 15, fontWeight: 600, textDecoration: 'none',
                color: isScrolled ? '#475569' : 'rgba(255,255,255,0.85)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = '#16a34a'}
              onMouseLeave={e => e.target.style.color = isScrolled ? '#475569' : 'rgba(255,255,255,0.85)'}
            >
              {link.name}
            </a>
          ))}
          <a
            href="#contact"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              padding: '11px 28px',
              borderRadius: 100,
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
              transition: 'all 0.2s',
              letterSpacing: '0.2px',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.3)'; e.currentTarget.style.transform = 'none'; }}
          >
            Get Quote
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: isScrolled ? '#0a0f1e' : 'white',
            padding: 8, display: 'none',
          }}
          className="pv-mobile-toggle"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'white',
              padding: '100px 32px 48px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <img src="/logo.svg" alt="Power Volt" style={{ width: 48, height: 48, borderRadius: '50%' }} />
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0a0f1e' }}>
                Power<span style={{ color: '#16a34a' }}>Volt</span>
              </span>
            </div>

            {navLinks.map(link => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  fontSize: 32, fontWeight: 900, color: '#0a0f1e',
                  textDecoration: 'none', paddingBottom: 24, borderBottom: '1px solid #f1f5f9',
                  marginBottom: 24, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.target.style.color = '#16a34a'}
                onMouseLeave={e => e.target.style.color = '#0a0f1e'}
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', border: 'none', cursor: 'pointer',
                padding: '18px 0', borderRadius: 18,
                fontSize: 20, fontWeight: 900, marginTop: 'auto',
                boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
              }}
            >
              Get Started
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .pv-desktop-nav { display: none !important; }
          .pv-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
