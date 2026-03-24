"use client";
import React from "react";
import Link from "next/link";

export const MagicCard = ({ children, href, glowColor, className = "" }: { children: React.ReactNode, href?: string, glowColor: string, className?: string }) => {
  const content = (
    <div className={`relative group overflow-hidden rounded-[2.5rem] p-[1px] shadow-2xl ${className}`}>
      {/* Raggio rotante veloce (1.5s), visibile all'hover */}
      <div 
        className="absolute inset-[-100%] animate-[spin_1.5s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundImage: `conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 75%, ${glowColor})` }}
      />
      {/* Centro COMPLETAMENTE OPACO (bg-[#0a0a0a]) per bloccare la luce al centro */}
      <div className="relative h-full w-full flex flex-col rounded-[calc(2.5rem-1px)] bg-[#0A0A0A] z-10 overflow-hidden transition-colors duration-500 group-hover:bg-[#111111]">
        {children}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
};
