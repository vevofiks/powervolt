import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Consultation',
    description: 'We begin with an in-depth discussion of your project goals, technical requirements, timeline, and budget to ensure complete alignment.',
    icon: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  },
  {
    number: '02',
    title: 'Site Inspection',
    description: 'Our senior engineers visit the site to conduct a thorough assessment of existing infrastructure, safety conditions, and spatial requirements.',
    icon: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
  },
  {
    number: '03',
    title: 'Planning',
    description: 'We develop detailed engineering drawings, material specifications, project schedules, and cost breakdowns for your review and approval.',
    icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
  },
  {
    number: '04',
    title: 'Installation',
    description: 'Our certified field teams execute the project with absolute precision, adhering to all safety standards and quality benchmarks throughout.',
    icon: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
  },
  {
    number: '05',
    title: 'Final Delivery',
    description: 'We perform comprehensive load testing, safety certification, documentation handover, and a full walkthrough before project sign-off.',
    icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  },
];

const WorkProcess = () => {
  return (
    <section style={{ padding: '120px 0', background: 'white', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(22,163,74,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 96px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 2, background: '#16a34a', borderRadius: 2 }} />
            <span style={{ color: '#16a34a', fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', fontSize: 12 }}>
              How We Work
            </span>
            <div style={{ width: 32, height: 2, background: '#16a34a', borderRadius: 2 }} />
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 900, color: '#0a0f1e', letterSpacing: '-1.5px', marginBottom: 20 }}
          >
            Our Streamlined Work Process
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8 }}
          >
            From first consultation to final handover, every project follows our proven 5-step framework — ensuring clarity, quality, and on-time delivery.
          </motion.p>
        </div>

        {/* Steps */}
        <div style={{ position: 'relative' }}>
          {/* Connecting line */}
          <div style={{
            display: 'none',
            position: 'absolute', top: 52, left: '10%', right: '10%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, #dcfce7, #16a34a, #dcfce7, transparent)',
          }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              >
                {/* Step number + icon circle */}
                <div style={{ position: 'relative', marginBottom: 28 }}>
                  <motion.div
                    whileHover={{ scale: 1.08, borderColor: '#16a34a', boxShadow: '0 0 0 8px rgba(22,163,74,0.08)' }}
                    style={{
                      width: 96, height: 96, borderRadius: '50%',
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {step.icon}
                    </svg>
                  </motion.div>
                  {/* Number badge */}
                  <div style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white', fontSize: 12, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                  }}>
                    {index + 1}
                  </div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0a0f1e', marginBottom: 12, letterSpacing: '-0.3px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, maxWidth: 220 }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkProcess;
