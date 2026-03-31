import React from "react";
import Sidebar from "@/components/Sidebar";

import { PortfolioProvider } from "../context/PortfolioContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortfolioProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Top Header (Optional, for Breadcrumbs or User Menu if needed later, kept minimal for now as per requirements) */}
          {/* <header className="h-16 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
              ...
          </header> */}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
              <div className="md:pt-0 pt-12"> {/* Padding top for mobile menu button breathing room */}
                  {children}
              </div>
          </div>
        </main>
      </div>
    </PortfolioProvider>
  );
}
