import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-[rgba(20,22,28,0.14)] bg-white/82 px-2 py-1 text-xs font-medium text-[#3a3d45]",
        className,
      )}
      {...props}
    />
  );
}
