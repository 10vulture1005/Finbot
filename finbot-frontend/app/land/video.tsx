"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ShieldCheck,
  Zap,
  Briefcase,
  MoreHorizontal,
  PieChart as PieChartIcon,
  Brain,
  ArrowRight
} from "lucide-react";

// --- Mock Data & Components from Dashboard ---

// Colors adapted for Dark Hero Theme
const COLORS = {
  chart1: "#06b6d4", // cyan-500
  chart2: "#3b82f6", // blue-500
  chart3: "#10b981", // emerald-500
  chart4: "#f59e0b", // amber-500
  chart5: "#6366f1", // indigo-500
  bgCard: "bg-gray-900/40",
  border: "border-white/10",
  textMuted: "text-gray-400",
  textMain: "text-white"
};

const performanceData = [
  { month: "Jan", value: 10000 },
  { month: "Feb", value: 12500 },
  { month: "Mar", value: 11800 },
  { month: "Apr", value: 14200 },
  { month: "May", value: 13900 },
  { month: "Jun", value: 16500 },
  { month: "Jul", value: 18200 },
  { month: "Aug", value: 17800 },
  { month: "Sep", value: 21000 },
  { month: "Oct", value: 24500 },
  { month: "Nov", value: 23800 },
  { month: "Dec", value: 28450 },
];

const allocationData = [
  { name: "Stocks", value: 65, color: COLORS.chart1 },
  { name: "SGBs", value: 15, color: COLORS.chart2 },
  { name: "MFs", value: 10, color: COLORS.chart3 },
  { name: "Crypto", value: 5, color: COLORS.chart4 },
  { name: "Cash", value: 5, color: COLORS.chart5 },
];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`backdrop-blur-md rounded-xl border shadow-sm ${COLORS.bgCard} ${COLORS.border} ${className}`}>
    {children}
  </div>
);

const KPICard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  subtitle
}: {
  title: string;
  value: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  subtitle?: string;
}) => (
  <Card className="p-5 flex flex-col justify-between h-full hover:bg-white/5 transition-colors duration-300">
    <div className="flex justify-between items-start mb-3">
        <span className={`text-sm font-medium ${COLORS.textMuted}`}>{title}</span>
        <Icon size={18} className="text-gray-500" />
    </div>
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-2xl font-semibold tracking-tight tabular-nums ${COLORS.textMain}`}>{value}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
         {trend && (
          <span
            className={`flex items-center font-medium ${
              trend === "up"
                ? "text-emerald-400"
                : trend === "down"
                ? "text-rose-400"
                : "text-gray-400"
            }`}
          >
            {trend === "up" ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {trendValue}
          </span>
        )}
        <span className="text-gray-500">{subtitle}</span>
      </div>
    </div>
  </Card>
);

// --- Real Dashboard Replica Component ---

interface DashboardReplicaProps {
  show: boolean;
}

function DashboardReplica({ show }: DashboardReplicaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.95 }}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 100, scale: 0.95 }}
      transition={{
        duration: 1.2,
        delay: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="glass rounded-3xl overflow-hidden shadow-sm border border-white/10 w-full max-w-7xl mx-auto relative z-10"
    >
      <div className="bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-xl p-6 md:p-8">
        
        {/* Header-like top bar */}
        <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
           <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Overview</h1>
              <p className="text-sm text-gray-400">Portfolio performance and analytics.</p>
           </div>
           <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xs font-bold ring-1 ring-cyan-500/20">JS</div>
           </div>
        </div>

        {/* Dashboard Grid */}
        <div className="space-y-6">
            
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Investment"
                    value="₹12.45L"
                    icon={Briefcase}
                    subtitle="Cap."
                />
                <KPICard
                    title="Current Value"
                    value="₹14.89L"
                    icon={DollarSign}
                    trend="up"
                    trendValue="+19.6%"
                    subtitle="Total"
                />
                <KPICard
                    title="Today's P&L"
                    value="+₹12.4k"
                    icon={Activity}
                    trend="up"
                    trendValue="+0.8%"
                    subtitle="Intraday"
                />
                 <KPICard
                    title="Net Returns"
                    value="+₹2.44L"
                    icon={Zap}
                    trend="up"
                    trendValue="+19.6%"
                    subtitle="All time"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart Area - 2/3 width */}
                <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between p-6 pb-2">
                        <div>
                           <h3 className="font-medium text-sm text-gray-400 tracking-wide uppercase">Growth Trajectory</h3>
                        </div>
                        <MoreHorizontal size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 w-full px-4 pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValueHero" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.chart1} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.chart1} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9ca3af', fontSize: 11 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    tickFormatter={(value) => `₹${value/1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ display: 'none' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={COLORS.chart1} 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValueHero)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Side Column - 1/3 width */}
                <div className="space-y-6">
                    {/* Allocation */}
                    <Card className="flex flex-col h-[280px]">
                        <div className="flex items-center justify-between p-6 pb-0">
                            <h3 className="font-medium text-sm text-gray-400 tracking-wide uppercase">Allocation</h3>
                            <PieChartIcon size={16} className="text-gray-500" />
                        </div>
                        <div className="flex-1 relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        cornerRadius={4}
                                        strokeWidth={0}
                                    >
                                        {allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                             {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium pt-4">Total</p>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="px-6 pb-6 grid grid-cols-2 gap-2">
                             {allocationData.slice(0,4).map((item) => (
                                 <div key={item.name} className="flex items-center gap-2 text-xs">
                                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                     <span className="text-gray-400 truncate">{item.name}</span>
                                     <span className="font-medium text-gray-300 ml-auto">{item.value}%</span>
                                 </div>
                             ))}
                        </div>
                    </Card>

                    {/* AI Insight */}
                    <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-black p-5 shadow-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500">
                             <Brain size={80} />
                        </div>
                        <div className="relative z-10">
                             <div className="flex items-center gap-2 mb-3 text-cyan-400">
                                 <Brain size={16} />
                                 <span className="text-xs font-bold uppercase tracking-wider">AI Analysis</span>
                             </div>
                             <h4 className="font-medium text-white mb-2 text-sm leading-relaxed">
                                 Technology exposure is high (40%).
                             </h4>
                             <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                 Consider rebalancing into defensive sectors.
                             </p>
                             <div className="flex items-center gap-1 text-xs font-medium text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors">
                                 Full Analysis <ArrowRight size={12} />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Hero Component ---

interface HeroWithStatsProps {
  heading?: React.ReactNode;
  subheading?: React.ReactNode;
  ctaPrimary?: string;
  ctaSecondary?: string;
}

export default function HeroWithStats({
  heading = (
    <>
      We create bright future{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 italic font-serif">
        for Investing.
      </span>
    </>
  ),
  subheading = "Empowering investors with AI-driven innovation, trust, and seamless portfolio management experiences.",
  ctaPrimary = "See trial",
  ctaSecondary = "Learn more",
}: HeroWithStatsProps) {
  
  const [mounted, setMounted] = useState(false);
  const mouseX = useSpring(0, { stiffness: 500, damping: 28 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 28 });

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - left);
    mouseY.set(event.clientY - top);
  }

  return (
    <div 
      className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center pt-24 pb-12 md:pb-20"
      onMouseMove={handleMouseMove}
    >
      
      {/* --- Background Effects --- */}
      
      {/* 1. Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{
             backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), 
                               linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
             backgroundSize: "40px 40px"
           }}
      />
      
      {/* 2. Blue Sunshine Effect (Top Left) */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full pointer-events-none z-0 blur-3xl opacity-40 mix-blend-screen"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.8) 0%, rgba(6,182,212,0.1) 60%, transparent 80%)"
        }}
      />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full point-events-none z-0 blur-3xl opacity-10 bg-teal-900/50" />

      {/* 3. Animated Sunshine Wave (Top Right to Bottom Left) */}
      <motion.div 
        initial={{ x: "40%", y: "-40%", opacity: 0 }}
        animate={{ 
          x: ["40%", "-100%"],
          y: ["-40%", "100%"],
          opacity: [0, 0.4, 0],
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-[120vw] h-[120vh] rounded-full pointer-events-none z-0 blur-[120px] mix-blend-screen"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)"
        }}
      />

      {/* 3. Cursor Following Light */}
      <motion.div
        className="absolute top-0 left-0 w-20 h-20 rounded-full pointer-events-none z-50 blur-xl opacity-60 mix-blend-screen"
        style={{
          x: mouseX,
          y: mouseY,
          background: "radial-gradient(circle, rgba(34,211,238,0.8) 0%, rgba(6,182,212,0.2) 70%, transparent 100%)",
          translateX: "-50%",
          translateY: "-50%"
        }}
      />

      {/* --- Content --- */}
      <div className="relative z-10 w-full px-4 md:px-6 flex flex-col items-center gap-12 md:gap-16">
        
        {/* Text Section - Centered */}
        <div className="max-w-4xl mx-auto text-center space-y-8 mt-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight"
            >
              {heading}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              {subheading}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={mounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button className="bg-white text-black px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all shadow-sm hover:shadow-md shadow-cyan-500/10">
                {ctaPrimary}
              </button>
              <button className="px-8 py-3.5 rounded-full font-semibold text-lg text-white border border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all hover:border-white/40">
                {ctaSecondary}
              </button>
            </motion.div>
        </div>

        {/* Visual Section - Dashboard Replica */}
        <div className="w-full max-w-[1400px] mx-auto perspective-1000 px-2 lg:px-8">
           <DashboardReplica show={mounted} />
        </div>

      </div>
    </div>
  );
}
