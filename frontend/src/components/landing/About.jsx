import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  const highlights = [
    { text: 'State-of-the-art technology and certified tools' },
    { text: 'Highly skilled and licensed engineering team' },
    { text: 'Unwavering commitment to safety and quality' },
    { text: 'Tailored solutions for complex industrial needs' },
  ];

  return (
    <section id="about" style={{ padding: '120px 0', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>

          {/* Image column */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ flex: '1 1 420px', position: 'relative', minWidth: 300 }}
          >
            {/* Main image container */}
            <div style={{
              borderRadius: 36,
              overflow: 'hidden',
              height: 580,
              position: 'relative',
              boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
            }}>
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=900"
                alt="Power Volt Engineers"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = 'linear-gradient(135deg, #0f172a, #1a2744)';
                  e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#4ade80;font-size:80px;">⚡</div>';
                }}
              />
              {/* Gradient overlay at bottom */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
              }} />
            </div>

            {/* Floating experience badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: -24, right: -16,
                background: 'white',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: 46, fontWeight: 900, color: '#16a34a', lineHeight: 1, marginBottom: 4 }}>15+</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0f1e' }}>Years Excellence</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>In Electrical Engineering</div>
            </motion.div>

            {/* Small floating badge top-left */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{
                position: 'absolute', top: 28, left: -20,
                background: '#0f172a',
                borderRadius: 20,
                padding: '16px 20px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'rgba(22,163,74,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>ISO Certified</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Safety Standards</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content column */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ flex: '1 1 420px', minWidth: 300 }}
          >
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 2, background: '#16a34a', borderRadius: 2 }} />
              <span style={{ color: '#16a34a', fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', fontSize: 12 }}>
                About Our Company
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 900,
              color: '#0a0f1e',
              lineHeight: 1.12,
              marginBottom: 24,
              letterSpacing: '-1.5px',
            }}>
              Pioneering the Standards of Electrical Engineering.
            </h2>

            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.9, marginBottom: 16 }}>
              Founded in 2009, Power Volt has been at the forefront of electrical contracting, delivering complex projects with precision and safety across industrial, commercial, and infrastructure sectors.
            </p>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.9, marginBottom: 44 }}>
              Our mission is to be the most trusted electrical engineering partner — combining cutting-edge technology with deep field expertise to provide solutions that stand the test of time.
            </p>

            {/* Highlights list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 52 }}>
              {highlights.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#dcfce7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <span style={{ fontSize: 15, color: '#334155', fontWeight: 600 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA button */}
            <motion.a
              href="#services"
              whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(22,163,74,0.3)' }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                padding: '17px 36px', borderRadius: 14,
                fontWeight: 800, fontSize: 15,
                textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(22,163,74,0.2)',
                transition: 'all 0.25s ease',
              }}
            >
              Explore Our Services
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
