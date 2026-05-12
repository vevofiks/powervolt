import React from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Experienced Team',
    description: 'Our engineers bring decades of collective expertise to every single project we undertake — from small installations to mega industrial contracts.',
    icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  },
  {
    title: 'Fast Service',
    description: 'We prioritize speed and efficiency at every stage — from quotation to project handover — without ever compromising on quality or safety.',
    icon: <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
  },
  {
    title: 'Trusted Quality',
    description: 'Our work is synonymous with reliability, durability, and long-term performance — backed by industry certifications and rigorous QA processes.',
    icon: <><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></>,
  },
  {
    title: 'Professional Support',
    description: 'Dedicated account managers and round-the-clock technical assistance ensure our clients always have a responsive point of contact.',
    icon: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>,
  },
  {
    title: 'Safety Standards',
    description: 'Rigorous adherence to international safety protocols, local electrical codes, and compliance regulations on every project site.',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  },
  {
    title: 'Affordable Solutions',
    description: 'Transparent pricing and cost-effective engineering approaches that deliver maximum value and ROI for your investment.',
    icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></>,
  },
];

const WhyChooseUs = () => {
  return (
    <section style={{ padding: '120px 0', background: '#0a0f1e', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative lights */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-5%', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(22,163,74,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-5%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 80, flexWrap: 'wrap', gap: 32 }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 2, background: '#16a34a', borderRadius: 2 }} />
              <span style={{ color: '#4ade80', fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', fontSize: 12 }}>
                Why Choose Power Volt
              </span>
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-1.5px' }}
            >
              Excellence in Every Wire,<br />Integrity in Every Connection.
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ color: '#475569', maxWidth: 340, fontSize: 15, lineHeight: 1.85 }}
          >
            We don't just provide services — we build long-term partnerships based on trust, quality, and exceptional engineering that stands the test of time.
          </motion.p>
        </div>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ borderColor: 'rgba(22,163,74,0.3)', background: 'rgba(255,255,255,0.04)' }}
              style={{
                padding: '40px 36px',
                borderRadius: 28,
                background: 'rgba(255,255,255,0.025)',
                border: '1.5px solid rgba(255,255,255,0.07)',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'rgba(22,163,74,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 28,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {feature.icon}
                </svg>
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-0.3px' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#475569', lineHeight: 1.8, fontSize: 15 }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
