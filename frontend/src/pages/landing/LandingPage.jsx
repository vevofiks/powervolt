import React from 'react';
import Navbar from '../../components/landing/Navbar';
import Hero from '../../components/landing/Hero';
import Services from '../../components/landing/Services';
import About from '../../components/landing/About';
import WhyChooseUs from '../../components/landing/WhyChooseUs';
import WorkProcess from '../../components/landing/WorkProcess';
import Statistics from '../../components/landing/Statistics';
import CTA from '../../components/landing/CTA';
import Footer from '../../components/landing/Footer';

const LandingPage = () => {
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", overflowX: 'hidden' }}>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <About />
        <Statistics />
        <WhyChooseUs />
        <WorkProcess />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
