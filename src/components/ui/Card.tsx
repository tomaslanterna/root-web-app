import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-[#111114] border-0 text-white rounded-3xl overflow-hidden shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] hover:bg-[#16171D] transition-all duration-300", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative overflow-hidden", className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-4 space-y-2.5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-4 py-3 border-t border-white/[0.04] flex items-center justify-between bg-black/30", className)}>{children}</div>;
}


