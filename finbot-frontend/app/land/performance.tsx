import React, { useState, useEffect } from 'react';

export default function Performance() {
  const [timeframe, setTimeframe] = useState('Monthly');
  const [isVisible, setIsVisible] = useState(false);
  const [animateCircle, setAnimateCircle] = useState(false);
  const sectionRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTimeout(() => setAnimateCircle(true), 300);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold: 0.2 } // Trigger when 20% visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  const monthlyData = [
    { month: 'Jun', value: 9.8, height: 35 },
    { month: 'Jul', value: 10, height: 60 },
    { month: 'Aug', value: 11, height: 69},
    { month: 'Sep', value: 11.7, height: 85 },
    { month: 'Oct', value: 14.6, height: 70 }
  ];

  return (
    <div ref={sectionRef} className="min-h-screen bg-gradient-to-b from-[#BFE1FF] via-blue-600 to-black p-4 md:p-8 flex flex-col items-center justify-center rounded-b-3xl overflow-hidden">
      {/* Hero Section */}
      <div className={`text-center mb-16 max-w-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h1 className="text-4xl md:text-6xl font-light text-gray-800 mb-2 md:mb-4">
          Maximise{' '}
          <span className="font-light italic">your portfolio</span>
        </h1>
        <h1 className="text-4xl md:text-6xl font-light text-gray-800 mb-6">
          value
        </h1>
        <p className="text-gray-100 text-lg">
          Track your returns with precision analytics and real-time insights
          <br />
          to optimize your investment performance.
        </p>
      </div>

      {/* Dashboard Card */}
      <div className={`w-full max-w-5xl bg-blue-400/30 backdrop-blur-sm rounded-3xl p-4 md:p-8 shadow-xs transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-2 md:pb-0">
            <button className="text-white font-medium border-b-2 border-white pb-2 transition-all hover:scale-105">
              Analytics
            </button>
            <button className="text-white/70 font-medium pb-2 hover:text-white transition-all hover:scale-105">
              Performance
            </button>
            <button className="text-white/70 font-medium pb-2 hover:text-white transition-all hover:scale-105">
              Returns
            </button>
          </div>
          <div className="relative">
            
            
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Stats Card */}
          <div className={`bg-white rounded-2xl p-6 md:p-8 shadow-xs w-full lg:w-80 flex-shrink-0 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80 * (animateCircle ? 0.72 : 0)} ${2 * Math.PI * 80}`}
                    strokeLinecap="round"
                    className="transition-all duration-1500 ease-out"
                  />
                </svg>
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                  <div className="text-gray-500 text-sm mb-1">Total Portfolio</div>
                  <div className="text-3xl font-bold text-gray-800">$1.24M</div>
                </div>
              </div>
            </div>
            <div className={`flex justify-between pt-4 border-t border-gray-200 transition-all duration-700 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div>
                <div className="text-xs text-gray-500 mb-1">Last 30 days</div>
                <div className="text-xl font-bold text-gray-800">16.4%</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Since previous 30 days</div>
                <div className="text-xl font-bold text-gray-800">12.8%</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className={`flex-1 h-64 lg:h-auto relative transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="absolute inset-0 grid grid-cols-5 gap-4 opacity-20">
              {[...Array(25)].map((_, i) => (
                <div key={i} className="border-r border-b border-white/50"></div>
              ))}
            </div>
            
            <div className="relative h-full flex items-end justify-around px-8 pb-8">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div 
                      className="w-10 sm:w-16 bg-gradient-to-t from-blue-300/80 to-blue-200/60 rounded-t-lg transition-all duration-500 hover:from-blue-400 hover:to-blue-300 cursor-pointer backdrop-blur-sm group-hover:scale-105 group-hover:shadow-xs"
                      style={{ 
                        height: `${data.height * 2}px`,
                        animation: `slideUp 0.6s ease-out ${index * 0.15 + 0.8}s both`
                      }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         style={{
                           animation: `fadeInDown 0.4s ease-out ${index * 0.15 + 1.2}s both`
                         }}>
                      {data.value}%
                    </div>
                  </div>
                  <div className="text-white font-medium text-sm opacity-0"
                       style={{
                         animation: `fadeIn 0.5s ease-out ${index * 0.15 + 1.4}s both`
                       }}>
                    {data.month}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center mt-6 text-xs text-white/60 transition-all duration-700 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} flex-col sm:flex-row gap-2 sm:gap-0`}>
          <div>Data provider: Custom analytics</div>
          <div>Updated: Just now</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}