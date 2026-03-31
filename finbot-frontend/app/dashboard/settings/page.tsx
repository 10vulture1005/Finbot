"use client";

import React, { useEffect, useState } from "react";
import { User, CreditCard, Shield, Bell, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { getCurrentUser, UserPortfolioData } from "@/app/services/portfolioService";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();
  const [user, setUser] = useState<UserPortfolioData | null>(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error);
  }, []);

  const handleLogout = () => {
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
      router.push("/auth/login");
  };

  const initials = user?.email?.substring(0,2).toUpperCase() || "U";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account, subscription, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Navigation */}
          <div className="md:col-span-1 space-y-1">
              {[
                  { icon: User, label: "Profile", active: true },
                  { icon: CreditCard, label: "Subscription", active: false },
                  { icon: Shield, label: "Security", active: false },
                  { icon: Bell, label: "Notifications", active: false },
              ].map((item) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        item.active 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                      <item.icon size={18} />
                      {item.label}
                  </button>
              ))}
              <div className="pt-4 mt-4 border-t border-border">
                  <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                      <LogOut size={18} /> Sign Out
                  </button>
              </div>
          </div>

          {/* Right Content */}
          <div className="md:col-span-2 space-y-6">
              
              {/* Profile Section */}
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">Profile Information</h2>
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                          {initials}
                      </div>
                      <div>
                          <button className="text-sm font-medium text-primary hover:underline">Change Avatar</button>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                          <input type="text" defaultValue={user?.email ? user.email.split('@')[0] : "User"} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <input type="email" defaultValue={user?.email || ""} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" readOnly />
                      </div>
                  </div>
              </section>

              {/* Subscription Section */}
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">Subscription Plan</h2>
                  <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg border border-primary/20 mb-6 flex justify-between items-center">
                      <div>
                          <p className="font-bold text-primary">Pro Plan</p>
                          <p className="text-sm text-muted-foreground">Billed monthly • Next billing date: Feb 12, 2026</p>
                      </div>
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">Active</span>
                  </div>
                  <div className="flex gap-4">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Upgrade Plan</button>
                      <button className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel Subscription</button>
                  </div>
              </section>

              {/* Preferences Section */}
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">Preferences</h2>
                  <div className="space-y-5">
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="font-medium text-sm text-foreground">Risk Tolerance</p>
                              <p className="text-xs text-muted-foreground">Adjust how our AI suggests rebalancing</p>
                          </div>
                          <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground">
                              <option>Conservative</option>
                              <option>Moderate</option>
                              <option>Aggressive</option>
                          </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="font-medium text-sm text-foreground">Appearance</p>
                              <p className="text-xs text-muted-foreground">Customize your interface theme</p>
                          </div>
                          <div className="flex gap-1 bg-muted p-1 rounded-lg border border-border">
                              <button 
                                onClick={() => setTheme("light")}
                                className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Light Mode"
                              >
                                  <Sun size={16} />
                              </button>
                              <button 
                                onClick={() => setTheme("dark")}
                                className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Dark Mode"
                              >
                                  <Moon size={16} />
                              </button>
                              <button 
                                onClick={() => setTheme("system")}
                                className={`p-2 rounded-md transition-all ${theme === 'system' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                title="System Default"
                              >
                                  <Monitor size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              </section>
          </div>
      </div>

    </div>
  );
}
