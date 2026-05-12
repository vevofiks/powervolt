import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section id="home" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 80,
      background: 'linear-gradient(135deg, #020617 0%, #0d1f3c 45%, #0a2218 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background glows */}
      <div style={{
        position: 'absolute', top: '15%', left: '-5%',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(22,163,74,0.18) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', right: '-5%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)',
      }} />

      {/* Grid dot pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Diagonal highlight line */}
      <div style={{
        position: 'absolute', top: 0, right: '25%',
        width: 1, height: '100%',
        background: 'linear-gradient(to bottom, transparent, rgba(22,163,74,0.3), transparent)',
        transform: 'rotate(15deg)',
        transformOrigin: 'top',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 920, margin: '0 auto' }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(22,163,74,0.1)',
              border: '1px solid rgba(74,222,128,0.25)',
              color: '#4ade80',
              padding: '10px 24px', borderRadius: 100,
              fontSize: 12, fontWeight: 800,
              marginBottom: 40, letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Innovating Electrical Engineering Since 2009
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            style={{
              fontSize: 'clamp(44px, 8.5vw, 88px)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.08,
              marginBottom: 32,
              letterSpacing: '-3px',
            }}
          >
            Powering the Future<br />
            <span style={{
              background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              With Precision.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              fontSize: 19,
              color: 'rgba(255,255,255,0.55)',
              maxWidth: 620,
              lineHeight: 1.85,
              marginBottom: 52,
              letterSpacing: '0.2px',
            }}
          >
            Industry-leading electrical contracting, installation, and maintenance solutions
            for industrial and commercial projects — delivered with safety-first precision.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 96 }}
          >
            <motion.a
              href="#services"
              whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(22,163,74,0.45)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                padding: '18px 40px',
                borderRadius: 16,
                fontWeight: 800,
                fontSize: 16,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 32px rgba(22,163,74,0.3)',
                transition: 'all 0.25s ease',
              }}
            >
              Get Started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.25)' }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                color: 'white',
                padding: '18px 40px',
                borderRadius: 16,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
              }}
            >
              Contact Us
            </motion.a>
          </motion.div>

          {/* Stats Strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            style={{
              display: 'flex',
              gap: 0,
              flexWrap: 'wrap',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 24,
              padding: '24px 40px',
              backdropFilter: 'blur(10px)',
              width: '100%',
              maxWidth: 720,
            }}
          >
            {[
              { value: '500+', label: 'Projects Completed' },
              { value: '15+', label: 'Years Experience' },
              { value: '120+', label: 'Happy Clients' },
              { value: '80+', label: 'Skilled Engineers' },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 140,
                textAlign: 'center',
                padding: '8px 16px',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#4ade80', lineHeight: 1, marginBottom: 6 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
