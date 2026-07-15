import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
}

/**
 * Field — label + control + optional hint, the wrapper every form control
 * sits in. Label uses the mono/eyebrow voice at field scale (tracked,
 * faint) so forms read as precise instruments, not casual copy.
 */
export function Field({ label, htmlFor, hint, className, children, labelProps }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        {...labelProps}
        className={cn(
          "font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-faint",
          labelProps?.className,
        )}
      >
        {label}
      </label>
      {children}
      {hint ? <span className="text-xs text-faint">{hint}</span> : null}
    </div>
  );
}

/**
 * Input — the one text-input surface: graphite fill (a step brighter than
 * the raised card it usually sits in), hairline border, gold focus ring.
 */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 rounded-lg border border-hairline bg-graphite px-3.5 text-[0.92rem] text-ink placeholder:text-faint outline-none transition-colors duration-200 ease-out-expo focus-visible:border-gold",
        className,
      )}
      {...rest}
    />
  );
}
