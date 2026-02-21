"use client"

import * as React from "react"
import { cn } from "./lib/utils"

type BadgeVariant = "solid" | "outline" | "subtle" | "destructive"

const variantClassNames: Record<BadgeVariant, string> = {
  solid: "bg-primary text-primary-foreground",
  outline: "bg-transparent text-foreground border border-border",
  subtle: "bg-muted text-foreground",
  destructive: "bg-destructive text-destructive-foreground",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = "solid", leadingIcon, trailingIcon, children, ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          variantClassNames[variant],
          className
        )}
        {...props}
      >
        {leadingIcon ? <span className="inline-flex h-3.5 w-3.5 items-center justify-center">{leadingIcon}</span> : null}
        <span>{children}</span>
        {trailingIcon ? <span className="inline-flex h-3.5 w-3.5 items-center justify-center">{trailingIcon}</span> : null}
      </span>
    )
  }
)

Badge.displayName = "Badge"
