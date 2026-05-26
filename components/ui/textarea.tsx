import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full resize-none rounded-md border border-[rgba(20,22,28,0.16)] bg-white/82 px-3 py-2 text-sm text-[#14161c] shadow-none transition-colors placeholder:text-[#8a8d94] hover:border-[rgba(20,22,28,0.26)] hover:bg-white focus-visible:border-[#b91942]/70 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
