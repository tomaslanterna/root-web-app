import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "danger";
  size?: "sm" | "md" | "lg" | "full" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-accent text-on-accent hover:bg-accent-hover",
      secondary: "bg-surface-2 text-ink border border-line-strong hover:bg-[#23272D]",
      outline: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
      ghost: "bg-transparent text-accent hover:bg-white/[0.06]",
      glass: "glass-obsidian text-accent hover:bg-white/[0.08]",
      danger: "bg-transparent text-danger border border-[rgba(255,107,107,0.45)] hover:bg-[rgba(255,138,128,0.08)]",
    };

    // Todo control táctil mide 44px o más.
    const sizes = {
      sm: "h-11 px-3.5 text-sm gap-1.5",
      md: "h-12 px-[18px] text-[15px] gap-2",
      lg: "h-[52px] px-6 text-base gap-2.5",
      full: "w-full h-12 px-[18px] text-[15px] gap-2",
      icon: "size-11",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-control font-semibold transition-[background-color,transform,opacity] duration-200 ease-out active:scale-[0.97] active:duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none",
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
