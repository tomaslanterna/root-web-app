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
      primary: "bg-[#D4FF00] text-neutral-950 hover:bg-[#bce400] shadow-md shadow-[#D4FF00]/15 border border-[#D4FF00] font-black",
      secondary: "bg-[#14171F] text-white hover:bg-[#1e2330] border border-white/10 font-bold",
      outline: "bg-transparent text-white border border-white/20 hover:bg-white/10 font-bold",
      ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-white/5 font-bold",
      glass: "glass-obsidian text-[#D4FF00] hover:bg-white/10 border-white/15 shadow-sm font-extrabold",
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

