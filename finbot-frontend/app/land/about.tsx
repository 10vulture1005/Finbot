"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface InfoCard {
  title: string;
  subtitle: string;
  color: string; // Tailwind color string (e.g., "text-blue-600")
}

interface AboutSectionProps {
  heading?: string;
  description1?: string;
  description2?: string;
  cards?: InfoCard[];
}

export default function AboutSection({
  heading = "About Our AI Service",
  description1 = "We leverage advanced machine learning algorithms and real-time market analysis to provide you with intelligent portfolio management solutions. Our AI-driven platform continuously monitors market trends, identifies opportunities, and executes trades with precision.",
  description2 = "Whether you're a seasoned trader or just starting your investment journey, our AI service adapts to your risk profile and financial goals, delivering personalized strategies that maximize returns while minimizing risk.",
  cards = [
    { title: "24/7", subtitle: "Market Monitoring", color: "text-blue-600" },
    { title: "AI", subtitle: "Powered Insights", color: "text-purple-600" },
    { title: "Smart", subtitle: "Risk Management", color: "text-pink-600" },
  ],
}: AboutSectionProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);

useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    // Create the scroll-triggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 75%",
        end: "top 75%",
        scrub: 1, // smooth scrub
        // markers: true, // enable for debugging
        
      },
    });

    tl.fromTo(
      el,
      {
        backgroundPositionX: "0%",
      },
      {
        backgroundPositionX: "-100%", // animates the highlight left -> right
        ease: "none", // use "none" with scrub for smooth linear progression
      }
    );

    return () => {
      // Only kill this specific timeline and its ScrollTrigger
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <div className="mt-10 min-h-screen bg-linear-to-b from-white to-[#D8DFFB] max-w-10xl mx-auto w-full  md:mt-14 px-3 md:px-14 animate-[fadeIn_1s_ease-out_1.5s_forwards] opacity-0">
      <div className="text-center max-w-7xl mx-auto">

        <h1 className="mt-50 mb-20 text-5xl  bold" style={{
                // gradient with two colors so we can shift the highlight across it
                background:
                  "linear-gradient(to right,  #BABAEA 0%, #309EFC 45%, #050B13 100%)",
                backgroundSize: "200% 100%",
                backgroundPositionX: "0%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
              }}>
            About FinBot
        </h1>
        <div className="text-2xl mb-30 md:text-3xl lg:text-4xl leading-relaxed">
          <p
            style={{
              background: "linear-gradient(to right, #BABAEA, #D5E4F3, #DFDFE0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            We believe wealth management should be intelligent for the modern investor.
          </p>

          <p
            className="font-medium"
            style={{
              background: "linear-gradient(to right, #BABAEA, #D5E4F3, #DFDFE0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            We deliver{" "}
            <span
              ref={spanRef}
              style={{
                // gradient with two colors so we can shift the highlight across it
                background:
                  "linear-gradient(to right,  #BABAEA 0%, #309EFC 50%, #050B13 100%)",
                backgroundSize: "200% 100%",
                backgroundPositionX: "0%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
              }}
            >
              real-time insights, smart risk control and wealth management
            </span>
          </p>

          <p
            style={{
              background: "linear-gradient(to right, #BABAEA, #D5E4F3, #DFDFE0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Helping traders and institutions grow consistently with transparent
            insights, smarter decisions, and next-generation portfolio
            automation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12">
        <div className="text-center p-6 rounded-2xl md:rounded-3xl backdrop-blur-lg bg-white/60 border border-white/60 shadow-xs hover:shadow-sm transition-all duration-300 hover:scale-105">
          <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
            24/7
          </div>
          <div className="text-sm text-gray-600">Market Monitoring</div>
        </div>
        <div className="text-center p-6 rounded-2xl md:rounded-3xl backdrop-blur-lg bg-white/60 border border-white/60 shadow-xs hover:shadow-sm transition-all duration-300 hover:scale-105">
          <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
            AI
          </div>
          <div className="text-sm text-gray-600">Powered Insights</div>
        </div>
        <div className="text-center p-6 rounded-2xl md:rounded-3xl backdrop-blur-lg bg-white/60 border border-white/60 shadow-xs hover:shadow-sm transition-all duration-300 hover:scale-105">
          <div className="text-3xl md:text-4xl font-bold text-pink-600 mb-2">
            Smart
          </div>
          <div className="text-sm text-gray-600">Risk Management</div>
        </div>
      </div>
    </div>
  );
}
