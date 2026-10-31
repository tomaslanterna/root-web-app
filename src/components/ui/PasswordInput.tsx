"use client";

import { useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
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
    <div className="relative">
      <input
        {...props}
        ref={inputRef}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("w-full h-[52px] bg-surface border border-line-strong rounded-control pl-3.5 pr-14 text-base text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent focus:border-[1.5px] transition-colors disabled:opacity-50", className)}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        aria-controls={props.id}
        onPointerDown={event => event.preventDefault()}
        onClick={toggle}
        className="absolute top-1/2 -translate-y-1/2 right-1 size-11 flex items-center justify-center text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent rounded-xl disabled:opacity-50"
      >
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
  );
}
