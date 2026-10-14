import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass";
  size?: "sm" | "md" | "lg" | "full" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-[#D4FF00] text-neutral-950 hover:bg-[#c2eb00] shadow-[0_10px_35px_rgba(212,255,0,0.16)] border-none font-black",
      secondary: "bg-[#14171F] text-white hover:bg-[#1c2230] border-0 shadow-[0_4px_16px_rgba(0,0,0,0.3)] font-bold",
      outline: "bg-white/[0.03] text-white border border-white/[0.08] hover:bg-white/[0.08] font-bold",
      ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06] font-bold",
      glass: "glass-obsidian text-[#D4FF00] hover:bg-white/[0.08] border-0 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] font-extrabold",
    };

    const sizes = {
      sm: "px-3.5 py-1.5 text-xs font-bold rounded-full gap-1.5",
      md: "px-4 py-2 text-sm font-extrabold rounded-full gap-2",
      lg: "px-6 py-3 text-sm font-black rounded-full gap-2.5",
      full: "w-full py-3 text-sm font-black rounded-full gap-2",
      icon: "p-2 rounded-full",
    };


    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

