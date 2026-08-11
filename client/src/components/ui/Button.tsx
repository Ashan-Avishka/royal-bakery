import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cocoa text-cream-alt hover:bg-cocoa-dark shadow-[0_1px_0_rgba(58,26,19,0.08)]",
  secondary:
    "bg-transparent text-cocoa border border-border-warm/80 hover:border-caramel/50 hover:bg-cream-alt",
  ghost: "bg-transparent text-cocoa hover:bg-honey-light/60",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
