"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Briefcase,
  Activity,
  Brain,
  LineChart,
  Goal,
  MessageSquare,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Portfolio", href: "/dashboard/portfolio", icon: Briefcase },
    { label: "Holdings", href: "/dashboard/holdings", icon: PieChart },
    { label: "Risk & Health", href: "/dashboard/risk", icon: Activity },
    { label: "AI Insights", href: "/dashboard/insights", icon: Brain },
    { label: "Stock Analysis", href: "/dashboard/analysis", icon: LineChart },
    // { label: "Goals & Planning", href: "/dashboard/goals", icon: Goal },
    { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleMobileToggle = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-md shadow-md"
        onClick={handleMobileToggle}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:h-screen
          ${collapsed ? "md:w-20" : "md:w-64"}
          w-64
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-sidebar border-b border-sidebar-border">
            {!collapsed && <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent truncate">Finbot AI</span>}
            {collapsed && <span className="text-xl font-bold text-sidebar-foreground mx-auto">FB</span>}
            
             <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 mx-2 rounded-md transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <Icon size={22} className={`${!collapsed && "mr-3 text-current"} ${collapsed && ""}`} />
                {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none text-sm border border-border">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile Placeholder */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
             <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-bold text-xs ring-2 ring-sidebar-ring">
                VP
             </div>
             {!collapsed && (
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">Vulture Prime</p>
                    <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                </div>
             )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
