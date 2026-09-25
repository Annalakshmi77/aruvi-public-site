import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0d4d3d] text-[#f5f0e6] shadow",
        secondary: "border-transparent bg-[#e5decf] text-[#0d382c]",
        saffron: "border-transparent bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground border-[#0d382c]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
