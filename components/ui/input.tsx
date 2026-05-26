import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[rgba(20,22,28,0.16)] bg-white/82 px-3 py-2 text-sm text-[#14161c] shadow-none transition-colors placeholder:text-[#8a8d94] hover:border-[rgba(20,22,28,0.26)] hover:bg-white focus-visible:border-[#b91942]/70 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
