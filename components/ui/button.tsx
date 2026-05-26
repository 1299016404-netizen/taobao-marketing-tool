import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-semibold tracking-[0px] transition-all duration-200 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#b91942] bg-[#b91942] text-white shadow-none hover:translate-y-[-1px] hover:border-[#a11438] hover:bg-[#a11438] active:translate-y-0",
        secondary:
          "border border-[rgba(20,22,28,0.14)] bg-white/82 text-[#171920] hover:translate-y-[-1px] hover:border-[rgba(20,22,28,0.24)] hover:bg-white active:translate-y-0",
        ghost:
          "text-[#3a3d45] hover:bg-white/66 hover:text-[#171920]",
        outline:
          "border border-[rgba(20,22,28,0.14)] bg-transparent text-[#171920] hover:border-[rgba(20,22,28,0.24)] hover:bg-white/72",
        teal:
          "border border-[rgba(20,22,28,0.14)] bg-white/82 text-[#171920] shadow-none hover:translate-y-[-1px] hover:border-[rgba(20,22,28,0.24)] hover:bg-white active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
