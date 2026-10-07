"use client";

import { useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, disabled, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number; end: number; focused: boolean } | null>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || !selection.current) return;
    const { start, end, focused } = selection.current;
    if (focused) input.focus({ preventScroll: true });
    input.setSelectionRange(start, end);
    selection.current = null;
  }, [visible]);

  const toggle = () => {
    const input = inputRef.current;
    if (input) selection.current = {
      start: input.selectionStart ?? input.value.length,
      end: input.selectionEnd ?? input.value.length,
      focused: document.activeElement === input,
    };
    setVisible(value => !value);
  };

  return (
    <div className="relative group">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
        <Lock size={18} />
      </div>
      <input
        {...props}
        ref={inputRef}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-14 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm", className)}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        aria-controls={props.id}
        onPointerDown={event => event.preventDefault()}
        onClick={toggle}
        className="absolute inset-y-0 right-1 w-11 flex items-center justify-center text-neutral-400 hover:text-acid-lime focus-visible:outline-2 focus-visible:outline-acid-lime rounded-xl disabled:opacity-50"
      >
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
  );
}
