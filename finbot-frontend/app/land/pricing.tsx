import { Check, ArrowRight, TrendingUp, Shield, Calculator, Zap, LineChart } from 'lucide-react';

export default function Pricing() {
  const featuresLeft = [
    'AI Trading Plan Generator',
    'Smart Position Sizing',
    'Volatility-Aware Analysis'
  ];
  
  const featuresMiddle = [
    'Risk Runway Calculator',
    'Maximum Drawdown Forecast',
    'Losing Streak Probability'
  ];
  
  const featuresRight = [
    'Trade Validity Score',
    'Portfolio Risk Dashboard',
    'Stop-Loss Optimization'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-[#D8DFFB] py-20 px-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-20 animate-fade-in-down">
          
          
          <h1 className="text-6xl md:text-8xl font-extrabold font-serif italic bg-clip-text text-gray-800  mb-6 tracking-tight animate-gradient">
            Pricing
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Professional trading risk management tools powered by cutting-edge artificial intelligence
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Features */}
          <div className="group bg-white rounded-3xl p-10 shadow-xs border border-slate-200 hover:border-blue-300 transition-all duration-700 hover:shadow-xs hover:shadow-blue-200/50 animate-slide-in-left">
            <div className="flex items-center gap-4 mb-8">
              
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-1">
                  Risk Management
                </h2>
                <p className="text-cyan-600 font-semibold">Complete Suite</p>
              </div>
            </div>
            
            <p className="text-slate-600 text-lg mb-12 leading-relaxed border-l-4 border-cyan-500 pl-4 bg-cyan-50/50 py-3 rounded-r-lg">
              Advanced AI algorithms designed to protect your capital, optimize trade execution, and maximize your trading survivability
            </p>
            
            <div className="grid md:grid-cols-3 gap-x-6 gap-y-8">
              <div className="space-y-6">
                {featuresLeft.map((feature, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 group/item animate-fade-in-up hover:translate-x-2 transition-transform duration-300" 
                    style={{animationDelay: `${idx * 150}ms`}}
                  >
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg p-1.5 flex-shrink-0 mt-0.5 group-hover/item:scale-125 group-hover/item:rotate-12 transition-all duration-300 shadow-xs shadow-emerald-500/30">
                      <Check className="w-4 h-4 text-gray-800" strokeWidth={3} />
                    </div>
                    <span className="text-slate-700 group-hover/item:text-slate-900 font-medium transition-colors duration-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-6">
                {featuresMiddle.map((feature, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 group/item animate-fade-in-up hover:translate-x-2 transition-transform duration-300" 
                    style={{animationDelay: `${(idx + 3) * 150}ms`}}
                  >
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg p-1.5 flex-shrink-0 mt-0.5 group-hover/item:scale-125 group-hover/item:rotate-12 transition-all duration-300 shadow-xs shadow-emerald-500/30">
                      <Check className="w-4 h-4 text-gray-800" strokeWidth={3} />
                    </div>
                    <span className="text-slate-700 group-hover/item:text-slate-900 font-medium transition-colors duration-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-6">
                {featuresRight.map((feature, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 group/item animate-fade-in-up hover:translate-x-2 transition-transform duration-300" 
                    style={{animationDelay: `${(idx + 6) * 150}ms`}}
                  >
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg p-1.5 flex-shrink-0 mt-0.5 group-hover/item:scale-125 group-hover/item:rotate-12 transition-all duration-300 shadow-xs shadow-emerald-500/30">
                      <Check className="w-4 h-4 text-gray-800" strokeWidth={3} />
                    </div>
                    <span className="text-slate-700 group-hover/item:text-slate-900 font-medium transition-colors duration-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Price Card */}
          <div className="group bg-gradient-to-br from-[#D8DFFB] via-blue-50 to-white rounded-3xl p-10 shadow-xs lg:sticky lg:top-8 border-2 border-white  transition-all duration-700  hover:shadow-xs hover:shadow-blue-300/50 animate-slide-in-right relative overflow-hidden">
            {/* Animated shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-xl group-hover:rotate-12 transition-transform duration-500 shadow-xs">
                    <LineChart className="w-7 h-7 text-blue-600" />
                  </div>
                  <span className="text-slate-900 font-bold text-xl">Annual Plan</span>
                </div>
                
              </div>
              
              <div className="mb-10">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-7xl md:text-8xl font-black text-black drop-shadow-xs ">Rs.50 </span>
                  <div className="flex flex-col">
                    <span className="text-2xl text-slate-700 font-semibold">/year</span>
                    
                  </div>
                </div>
                
              </div>
              
              <button className="w-full bg-black hover:to-cyan-700 text-white font-bold text-lg py-5 px-8 rounded-xl transition-all duration-300 shadow-xs hover:shadow-xs hover:scale-105 flex items-center justify-center gap-3 group/btn mb-8">
                Get Started Now
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform duration-300" />
              </button>
              
              <div className="space-y-4 pt-8 border-t-2 border-slate-200">
                <div className="flex items-center gap-3 text-slate-700 bg-white rounded-lg px-4 py-3 hover:bg-blue-50 transition-all duration-300 border border-slate-200 hover:border-blue-300">
                  <div className="bg-emerald-500 rounded-full p-1 shadow-xs">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium">Unlimited trade analysis</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 bg-white rounded-lg px-4 py-3 hover:bg-blue-50 transition-all duration-300 border border-slate-200 hover:border-blue-300">
                  <div className="bg-emerald-500 rounded-full p-1 shadow-xs">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium">Real-time risk monitoring</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 bg-white rounded-lg px-4 py-3 hover:bg-blue-50 transition-all duration-300 border border-slate-200 hover:border-blue-300">
                  <div className="bg-emerald-500 rounded-full p-1 shadow-xs">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium">Priority support & updates</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 bg-white rounded-lg px-4 py-3 hover:bg-blue-50 transition-all duration-300 border border-slate-200 hover:border-blue-300">
                  <div className="bg-emerald-500 rounded-full p-1 shadow-xs">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium">Advanced API access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-80px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(80px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes number-pop {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 1s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 1s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 1s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-number-pop {
          animation: number-pop 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}