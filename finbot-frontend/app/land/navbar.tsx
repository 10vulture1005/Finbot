"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
}

interface FloatingNavbarProps {
  navItems?: NavItem[];
  showCTA?: boolean;
  className?: string;
  isDark?: boolean;
}

export default function FloatingNavbar({
  navItems = [
    { label: "About Us", href: "/#about" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
  showCTA = true,
  className = "",
  isDark = false,
}: FloatingNavbarProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleSignup = () => {
    router.push("/auth/signup");
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const textColorClass = isDark ? "text-gray-900 hover:text-gray-600" : "text-white hover:text-gray-300";
  const mobileIconColor = isDark ? "text-gray-900" : "text-white";
  const ctaBtnLoginColor = isDark ? "text-gray-900 hover:text-gray-600" : "text-white hover:text-gray-400";
  // For the signup button, if isDark is true (light background), maybe we want a dark button?
  // Current design: text-white. 
  // If background is light, keep it standing out?
  // Let's stick to the existing button style for Signup, but maybe adjust if needed.
  // The current Signup button: text-white px-6 py-2 rounded-full font-medium hover:text-gray-400...
  // Wait, it doesn't have a background color?
  // It relies on hover:shadow-lg?
  // Ah, in video.tsx (Hero), there were buttons with background styles.
  // In navbar.tsx, line 91: 
  // className="text-white px-6 py-2 rounded-full font-medium hover:text-gray-400 transition-all duration-300 hover:shadow-lg"
  // It looks like it's just text? That seems weird for a "Sign up" button usually having a BG.
  // Actually, checking video.tsx hero buttons, they have BG.
  // In navbar, it seems transparent?
  // Let's create a solid button style for Signup if isDark is set, to ensure visibility.
  
  const signUpBtnClass = isDark 
    ? "bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg"
    : "bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-full font-medium hover:bg-white/20 transition-all duration-300 hover:shadow-lg border border-white/30";

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-50 p-3 md:p-4 ${className}`}
    >
      <nav className={`
        animate-[fadeIn_1s_ease-out_forwards] 
        p-1 
        backdrop-blur-md 
        bg-transparent 
        rounded-4xl md:rounded-[2.5rem] 
        border ${isDark ? "border-gray-200/50" : "border-transparent"} 
        shadow-xs 
        max-w-7xl mx-auto
      `}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${textColorClass} font-medium transition-colors`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Icon */}
            <div className="md:hidden">
              <button className={`${mobileIconColor} hover:text-gray-400 font-medium transition-colors`}>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* CTA Section */}
            {showCTA && (
              <div className="flex items-center gap-4">
                {isLoggedIn ? (
                  <button onClick={handleDashboard} className={signUpBtnClass}>
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button className={`font-medium transition-colors ${ctaBtnLoginColor}`} onClick={handleLogin}>
                      Login
                    </button>
                    <button onClick={handleSignup} className={signUpBtnClass}>
                      Sign up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
