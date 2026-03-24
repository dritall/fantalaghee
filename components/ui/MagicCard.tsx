"use client";
import React from "react";
import Link from "next/link";

export const MagicCard = ({ children, href, glowColor, className = "" }: { children: React.ReactNode, href?: string, glowColor: string, className?: string }) => {
  const content = (
    <div className={`relative group overflow-hidden rounded-[2.5rem] p-[1px] shadow-2xl ${className}`}>
      {/* Raggio Cromato Veloce On/Off (Animazione di 3s totali: 0.75s di giro, 2.25s fermo) */}
      <div 
        className="absolute inset-[-100%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ 
          backgroundImage: `conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 70%, #ffffff 85%, ${glowColor} 95%, transparent 100%)`,
          animation: 'chrome-sweep 3s infinite linear'
        }}
      />
      <div className="relative h-full w-full flex flex-col rounded-[calc(2.5rem-1px)] bg-[#0A0A0A] z-10 overflow-hidden transition-colors duration-500 group-hover:bg-[#111111]">
        {children}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
};
