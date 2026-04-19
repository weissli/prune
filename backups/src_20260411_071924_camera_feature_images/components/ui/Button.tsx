import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

// Simple Button component without CVA to save dependency overhead if not needed, 
// but CVA is great. I'll just write standard Tailwind classes.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md active:scale-95",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95",
      ghost: "hover:bg-slate-100 hover:text-slate-900 active:scale-95",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm active:scale-95",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-lg",
      icon: "h-10 w-10",
    };

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref as any}
        {...props as any}
      />
    );
  }
);
Button.displayName = "Button";
