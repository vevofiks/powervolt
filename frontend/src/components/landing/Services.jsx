import React from 'react';
import { motion } from 'framer-motion';

const services = [
  {
    title: 'Electrical Contracting',
    description: 'End-to-end electrical installation and contracting for large-scale commercial and industrial projects, with full code compliance.',
    iconSvg: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
    accentColor: '#16a34a',
    accentBg: 'rgba(22,163,74,0.08)',
    number: '01',
  },
  {
    title: 'Industrial Wiring',
    description: 'Precision wiring solutions for factories, processing plants, and industrial facilities — built for reliability under demanding conditions.',
    iconSvg: <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>,
    accentColor: '#2563eb',
    accentBg: 'rgba(37,99,235,0.08)',
    number: '02',
  },
  {
    title: 'Site Electrical Works',
    description: 'Complete temporary and permanent electrical infrastructure setup for construction and development project sites.',
    iconSvg: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
    accentColor: '#d97706',
    accentBg: 'rgba(217,119,6,0.08)',
    number: '03',
  },
  {
    title: 'Maintenance Services',
    description: 'Scheduled preventive maintenance plans and rapid 24/7 emergency response to minimize downtime and maximize safety.',
    iconSvg: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
    accentColor: '#dc2626',
    accentBg: 'rgba(220,38,38,0.08)',
    number: '04',
  },
  {
    title: 'Equipment Installation',
    description: 'Expert installation of industrial control panels, generators, transformers, and specialized high-voltage power systems.',
    iconSvg: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M18.66 18.66l1.41 1.41M4.93 4.93l1.41 1.41M22 12h-2M4 12H2M12 22v-2M12 4V2"/></>,
    accentColor: '#7c3aed',
    accentBg: 'rgba(124,58,237,0.08)',
    number: '05',
  },
  {
    title: 'Electrical Product Supply',
    description: 'Trusted supply chain for cables, switchgear, panels, and industrial electrical components from certified manufacturers.',
    iconSvg: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    accentColor: '#059669',
    accentBg: 'rgba(5,150,105,0.08)',
    number: '06',
  },
];

const Services = () => {
  return (
    <section id="services" style={{ padding: '120px 0', background: '#ffffff', position: 'relative' }}>
      {/* Subtle top-left decoration */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(22,163,74,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 80, gap: 32 }}>
          <div style={{ maxWidth: 540 }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}
            >
              <div style={{ width: 32, height: 2, background: '#16a34a', borderRadius: 2 }} />
              <span style={{ color: '#16a34a', fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', fontSize: 12 }}>
                Our Expertise
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{ fontSize: 'clamp(34px, 4.5vw, 54px)', fontWeight: 900, color: '#0a0f1e', lineHeight: 1.1, letterSpacing: '-1.5px' }}
            >
              Premium Electrical Solutions For Every Industry
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ color: '#64748b', maxWidth: 380, lineHeight: 1.85, fontSize: 16 }}
          >
            From large-scale industrial projects to routine maintenance, we provide specialized engineering services tailored to your exact requirements.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              whileHover={{ y: -6 }}
              style={{
                padding: '40px 36px',
                borderRadius: 28,
                background: '#f8fafc',
                border: '1.5px solid #f1f5f9',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.07)';
                e.currentTarget.style.borderColor = service.accentColor + '30';
                e.currentTarget.style.background = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#f1f5f9';
                e.currentTarget.style.background = '#f8fafc';
              }}
            >
              {/* Number badge top right */}
              <div style={{
                position: 'absolute', top: 28, right: 32,
                fontSize: 56, fontWeight: 900, color: 'rgba(0,0,0,0.04)', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums', userSelect: 'none',
              }}>
                {service.number}
              </div>

              {/* Icon */}
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: service.accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 28,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={service.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {service.iconSvg}
                </svg>
              </div>

              <h3 style={{ fontSize: 21, fontWeight: 800, color: '#0a0f1e', marginBottom: 14, letterSpacing: '-0.3px' }}>
                {service.title}
              </h3>
              <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: 15, marginBottom: 32 }}>
                {service.description}
              </p>

              {/* Learn more link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: service.accentColor, fontWeight: 700, fontSize: 14 }}>
                Learn More
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
