import React from 'react';
import { motion } from 'framer-motion';

const CTA = () => {
  return (
    <section id="contact" style={{ padding: '100px 0', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            borderRadius: 40,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)',
            padding: 'clamp(56px, 8vw, 96px)',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Abstract geometric decorations */}
          <div style={{
            position: 'absolute', top: '-30%', left: '-10%',
            width: '55%', height: '200%',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '50%',
            transform: 'rotate(-20deg)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40%', right: '-10%',
            width: '45%', height: '180%',
            background: 'rgba(0,0,0,0.08)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
          {/* Grid pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.4,
            pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', padding: '8px 20px',
              borderRadius: 100, fontSize: 12, fontWeight: 800,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 36,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Get Started Today
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(36px, 6vw, 68px)',
                fontWeight: 900,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: 24,
                letterSpacing: '-2px',
              }}
            >
              Need Professional<br />Electrical Solutions?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: 19, color: 'rgba(255,255,255,0.75)',
                maxWidth: 540, margin: '0 auto 52px',
                lineHeight: 1.8,
              }}
            >
              Contact our expert team today to discuss your project requirements and receive a comprehensive, no-obligation quote.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <motion.a
                href="tel:+1234567890"
                whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'white',
                  color: '#16a34a',
                  padding: '19px 44px',
                  borderRadius: 16,
                  fontWeight: 900, fontSize: 16,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  transition: 'all 0.25s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                Contact Us Now
              </motion.a>
              <motion.a
                href="mailto:contact@powervolt.com"
                whileHover={{ background: 'rgba(255,255,255,0.2)' }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.25)',
                  padding: '19px 44px',
                  borderRadius: 16,
                  fontWeight: 900, fontSize: 16,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.25s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Request a Quote
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
