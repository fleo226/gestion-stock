"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      disabled,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-xl
      transition-all duration-150 ease-out
      active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    `;

    const variants = {
      primary: `
        bg-[var(--primary)] text-white
        hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
        focus-visible:ring-[var(--primary)]
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-neutral-100 text-neutral-900
        hover:bg-neutral-200 active:bg-neutral-300
        focus-visible:ring-neutral-400
        border border-neutral-200
      `,
      outline: `
        bg-transparent text-[var(--primary)] border-2 border-[var(--primary)]
        hover:bg-[var(--accent-light)] active:bg-[var(--primary)]
        active:text-white focus-visible:ring-[var(--primary)]
      `,
      ghost: `
        bg-transparent text-neutral-700
        hover:bg-neutral-100 active:bg-neutral-200
        focus-visible:ring-neutral-400
      `,
      danger: `
        bg-red-600 text-white
        hover:bg-red-700 active:bg-red-800
        focus-visible:ring-red-500
        shadow-sm hover:shadow-md
      `,
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5 min-h-[40px]",
      md: "px-4 py-2 text-base gap-2 min-h-[44px]",
      lg: "px-6 py-3 text-lg gap-2 min-h-[48px]",
      xl: "px-8 py-4 text-xl gap-2.5 min-h-[52px]",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], widthClass, className)}
        style={style}
        {...props}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : iconLeft ? (
          <span className="flex-shrink-0" aria-hidden="true">{iconLeft}</span>
        ) : null}
        <span>{children}</span>
        {!loading && iconRight && (
          <span className="flex-shrink-0" aria-hidden="true">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";