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
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        {...labelProps}
        className={cn(
          "font-mono text-[0.68rem] font-medium tracking-[0.14em] text-faint uppercase",
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
 * Input — the one text-input surface: paper-sink fill (an inset, a step
 * quieter than the paper-deep card it usually sits in), hairline border,
 * cinnabar focus ring — the seal color earns its one non-CTA use here.
 */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 rounded-lg border border-hairline bg-paper-sink px-3.5 text-[0.92rem] text-ink placeholder:text-faint outline-none transition-colors duration-300 ease-out-expo focus-visible:border-cinnabar",
        className,
      )}
      {...rest}
    />
  );
}
