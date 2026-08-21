import type React from "react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  icon?: React.ReactNode;
  width?: number;
  className?: string;
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
  icon,
  width,
  className,
}: LiquidMetalButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const style: React.CSSProperties = width ? { width: `${width}px` } : {};

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={style}
      className={cn(
        "relative flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl transition-all duration-300 font-sans font-semibold text-xs cursor-pointer select-none",
        "bg-white/[0.03] backdrop-blur-md border border-white/[0.08]",
        "hover:bg-white/[0.08] hover:border-white/[0.18] hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] hover:-translate-y-0.5",
        "active:scale-95 active:translate-y-0 active:bg-white/[0.01] active:border-white/[0.05]",
        isPressed && "scale-95 bg-white/[0.01]",
        viewMode === "icon" ? "aspect-square w-11 h-11 p-0 rounded-full" : "w-full",
        className
      )}
    >
      {/* Soft inner glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {icon && (
        <span className="text-white/80 filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105 shrink-0">
          {icon}
        </span>
      )}
      
      {viewMode === "text" && (
        <span className="text-white font-medium tracking-wide text-right font-sans filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          {label}
        </span>
      )}
    </button>
  );
}
