"use client";
import React, { useState, useEffect, useRef } from "react";
import AboutSection from "./about";
import FloatingNavbar from "./navbar";
import HeroWithStats from "./video";
import Advantage from "./advantage";
import Performance from "./performance";
import Pricing from "./pricing";
import FAQAccordion from "./Faqs";
import Footer from "./Footer";

export default function Landing() {
  const [isNavDark, setIsNavDark] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If Hero is not intersecting (meaning we scrolled past it), set Navbar to Dark
        setIsNavDark(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1, // Trigger when 10% of hero is visible/hidden - adjustment might be needed
        // We want to detect when we leave the hero section.
        // If we set rootMargin to be around the navbar height, we can detect better.
        rootMargin: "-80px 0px 0px 0px",
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <FloatingNavbar isDark={isNavDark} />
      
      <div className="relative z-20 flex flex-col min-h-screen transition-opacity duration-1000">
        
        <div className="h-full overflow-y-auto overflow-x-hidden md:h-screen md:snap-y md:snap-mandatory md:overflow-y-scroll">
         
          <section className="min-h-screen md:snap-start" ref={heroRef}>
            <HeroWithStats />
          </section>
          <section className="min-h-screen md:snap-start">

            <AboutSection />
          </section>
          <section className="min-h-screen md:snap-start">
            <Advantage />
          </section>

          <section className="min-h-screen md:snap-start">
            <Performance />
          </section>

          <section className="min-h-screen md:snap-start">
            <Pricing />
          </section>

          <section className="min-h-screen md:snap-start">
            <FAQAccordion />
          </section>

          <section className="md:snap-start ">
            <Footer />
          </section>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
