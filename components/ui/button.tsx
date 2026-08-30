import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-button transition-colors duration-150 select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-primary-hover active:bg-primary-pressed shadow-sm",
      secondary:
        "bg-white border border-border text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 shadow-sm",
      tertiary:
        "bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100",
      danger:
        "bg-white border border-semantic-error text-semantic-error hover:bg-semantic-error-subtle active:bg-red-100",
    };

    const sizeStyles = {
      default: "h-11 min-h-[44px] px-5 py-2.5 text-base",
      sm: "h-9 min-h-[36px] px-3 py-1.5 text-sm",
      lg: "h-12 min-h-[48px] px-6 py-3 text-lg",
      icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
