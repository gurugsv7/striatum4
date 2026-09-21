import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Widen further at md+ for a two-column list+detail layout. */
  wide?: boolean;
}

/** Mobile max-width 480px, centered; widens at md+. */
export function PageContainer({ wide, className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4",
        wide ? "max-w-[480px] md:max-w-[860px]" : "max-w-[480px] md:max-w-[560px]",
        className,
      )}
      {...props}
    />
  );
}
