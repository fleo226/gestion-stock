"use client";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "info" | "neutral" | "danger";
  dot?: boolean;
}

export const Badge = ({ className, variant = "default", dot = false, children, ...props }: BadgeProps) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full px-2.5 py-0.5 text-xs";

  const variants = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    success: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    neutral: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const dotColors = {
    default: "bg-gray-400",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
    neutral: "bg-gray-400",
    danger: "bg-red-500",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};