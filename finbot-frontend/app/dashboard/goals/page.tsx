"use client";

import React from "react";
import { Plus, Target, Check, Calendar, TrendingUp } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const goals = [
    {
        id: 1,
        title: "Retirement Fund",
        target: 20000000,
        current: 4500000,
        timeline: "2045",
        status: "On Track",
        progress: 22
    },
    {
        id: 2,
        title: "New House Downpayment",
        target: 5000000,
        current: 1200000,
        timeline: "2028",
        status: "Behind",
        progress: 24
    },
    {
        id: 3,
        title: "Vacation to Europe",
        target: 800000,
        current: 600000,
        timeline: "2026",
        status: "On Track",
        progress: 75
    }
];

const projectionData = [
    { year: '2024', actual: 4500000, projected: 4500000 },
    { year: '2025', actual: null, projected: 5200000 },
    { year: '2026', actual: null, projected: 6100000 },
    { year: '2027', actual: null, projected: 7200000 },
    { year: '2028', actual: null, projected: 8500000 },
    { year: '2029', actual: null, projected: 10000000 },
];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-card text-card-foreground rounded-[var(--radius)] border border-border/60 shadow-sm ${className}`}>
        {children}
    </div>
);

const ProgressBar = ({ progress, status }: { progress: number, status: string }) => {
    let colorClass = "bg-primary";
    if (status === "Behind") colorClass = "bg-rose-500";
    if (progress >= 100) colorClass = "bg-emerald-500";
    
    return (
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
        </div>
    )
}

export default function GoalsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[1600px] mx-auto p-2 md:p-0">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Financial Goals</h1>
                    <p className="text-sm text-muted-foreground">Track and plan your life objectives.</p>
                </div>
                <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:opacity-90 transition-opacity">
                    <Plus size={16} /> Add New Goal
                </button>
            </div>

            {/* Goals List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {goals.map((goal) => (
                    <Card key={goal.id} className="p-6 hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Target size={24} />
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${goal.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {goal.status}
                            </span>
                        </div>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Calendar size={14} /> Target: {goal.timeline}
                        </div>
                        
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Current</span>
                                <span className="font-medium">₹{(goal.current/100000).toFixed(2)}L</span>
                            </div>
                            <ProgressBar progress={goal.progress} status={goal.status} />
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Target</span>
                                <span className="font-medium">₹{(goal.target/100000).toFixed(2)}L</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
                            <span className="text-muted-foreground text-xs">{goal.progress}% Achieved</span>
                            <button className="text-primary hover:underline">View Details</button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Projection Area */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                     <div>
                        <h3 className="text-lg font-medium">Retirement Projection</h3>
                        <p className="text-sm text-muted-foreground">Projected growth based on current monthly contribution.</p>
                    </div>
                     <div className="flex gap-4 text-sm">
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-primary/50"></div>
                             <span>Projected</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-primary"></div>
                             <span>Actual</span>
                         </div>
                     </div>
                </div>
               
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} tickFormatter={(value) => `₹${value/100000}L`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()} Lakhs`, 'Amount']}
                            />
                            <Line type="monotone" dataKey="projected" stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>
    );
}
