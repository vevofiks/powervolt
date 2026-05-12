import React from 'react';
import { motion } from 'framer-motion';

const Statistics = () => {
  const stats = [
    {
      value: '500+',
      label: 'Projects Completed',
      desc: 'Across industrial & commercial sectors',
      icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>,
    },
    {
      value: '120+',
      label: 'Happy Clients',
      desc: 'Long-term partnerships & repeat business',
      icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    },
    {
      value: '15+',
      label: 'Years Experience',
      desc: 'Deep expertise built over decades',
      icon: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    },
    {
      value: '80+',
      label: 'Skilled Workers',
      desc: 'Certified engineers & field technicians',
      icon: <><path d="M22 20v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M2 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="9" cy="7" r="4"/></>,
    },
  ];

  return (
    <section style={{
      padding: '100px 0',
      background: 'linear-gradient(135deg, #020617 0%, #0d1f3c 50%, #0a2218 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 400,
        background: 'radial-gradient(ellipse, rgba(22,163,74,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Section label */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}
          >
            <div style={{ width: 32, height: 1, background: 'rgba(74,222,128,0.4)' }} />
            <span style={{ color: '#4ade80', fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', fontSize: 12 }}>
              By The Numbers
            </span>
            <div style={{ width: 32, height: 1, background: 'rgba(74,222,128,0.4)' }} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px' }}
          >
            Trusted by Industry Leaders
          </motion.h2>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: '48px 40px',
                textAlign: 'center',
                borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                position: 'relative',
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(22,163,74,0.12)',
                border: '1px solid rgba(22,163,74,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {stat.icon}
                </svg>
              </div>

              <div style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, color: '#4ade80', lineHeight: 1, marginBottom: 12, letterSpacing: '-2px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
