import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#0d4d3d] text-[#f5f0e6] hover:bg-[#09382c]",
        primary: "bg-[#0d4d3d] text-[#f5f0e6] hover:bg-[#09382c]",
        saffron: "bg-[#e58a00] text-[#0d382c] hover:bg-[#d97706] font-bold shadow-sm",
        outline: "border border-[#0d382c]/20 bg-transparent text-[#0d382c] hover:border-[#0d4d3d] hover:bg-[#0d4d3d]/5",
        secondary: "bg-[#e5decf] text-[#0d382c] hover:bg-[#dcd4c3]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        ghost: "text-[#0d382c] hover:bg-[#0d4d3d]/10",
        link: "text-[#0d4d3d] underline-offset-4 hover:underline",
        filter: "min-h-8 rounded-full border border-[#0d382c]/20 px-4 py-1 text-xs text-[#0d382c]/70 hover:border-[#0d4d3d] hover:text-[#0d4d3d] transition-all bg-white/40",
        filterActive: "min-h-8 rounded-full bg-[#0d4d3d] px-4 py-1 text-xs text-[#f5f0e6] font-medium shadow-sm",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return <Component ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
