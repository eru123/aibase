"use client"

import * as React from "react"
import { cn } from "./lib/utils"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  isRequired?: boolean
  requiredIndicator?: React.ReactNode
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, requiredIndicator, isRequired, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-semibold leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
          className
        )}
        {...props}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {isRequired || props['aria-required'] ? (
            <span className="text-destructive" aria-hidden="true">
              {requiredIndicator ?? "*"}
            </span>
          ) : null}
        </span>
      </label>
    )
  }
)

Label.displayName = "Label"
