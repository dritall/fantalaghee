"use client";
import React from "react";
import Link from "next/link";

export const MagicCard = ({ children, href, glowColor, className = "" }: { children: React.ReactNode, href?: string, glowColor: string, className?: string }) => {
  const content = (
    <div className={`relative group overflow-hidden rounded-[2.5rem] p-[1px] shadow-[0_8px_30px_rgba(15,35,25,0.10)] ${className}`}>
      {/* Raggio visibile e animato SOLO durante l'hover sulla card specifica */}
      <div
        className="animate-sweep absolute inset-[-100%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          backgroundImage: `conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 70%, #ffffff 85%, ${glowColor} 95%, transparent 100%)`
        }}
      />
      <div className="relative h-full w-full flex flex-col rounded-[calc(2.5rem-1px)] bg-white/80 backdrop-blur-xl border border-white/60 z-10 overflow-hidden transition-colors duration-500 group-hover:bg-white">
        {children}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
};
