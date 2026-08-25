"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const animationProps: HTMLMotionProps<"button"> = {
  initial: { "--x": "100%", scale: 1 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.96 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1.5,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 300,
      damping: 15,
      mass: 0.5,
    },
  },
};

export interface ShinyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({
  children,
  className,
  href,
  onClick,
  ...props
}) => {
  const buttonContent = (
    <motion.button
      {...animationProps}
      {...props}
      onClick={onClick}
      className={cn(
        "group relative rounded-xl px-4 py-2 font-semibold transition-all duration-300 ease-out cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#9333EA] text-white shadow-[0_5px_18px_-3px_rgba(124,58,237,0.55)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.85)] hover:scale-[1.02] active:scale-[0.97] border border-white/30 hover:border-white/50 overflow-hidden",
        className
      )}
    >
      {/* Top-right glossy flare overlay matching user's reference image */}
      <div aria-hidden className="absolute top-0 right-0 w-14 h-14 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.45),transparent_70%)] pointer-events-none rounded-tr-xl" />

      {/* Button Children text & icon */}
      <span className="relative z-10 flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-bold text-white tracking-wide drop-shadow-sm">
        {children}
      </span>

      {/* Animated shimmer border overlay */}
      <span
        style={{
          mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
          WebkitMask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
        }}
        className="absolute inset-0 z-20 block rounded-[inherit] bg-[linear-gradient(-75deg,rgba(255,255,255,0.25)_calc(var(--x)+20%),rgba(255,255,255,0.95)_calc(var(--x)+25%),rgba(255,255,255,0.25)_calc(var(--x)+100%))] p-px pointer-events-none"
      />
    </motion.button>
  );

  if (href) {
    if (href.startsWith("http") || href.startsWith("#")) {
      return (
        <a href={href} className="inline-block no-underline">
          {buttonContent}
        </a>
      );
    }
    return (
      <Link to={href} className="inline-block no-underline">
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
};

export default { ShinyButton };
