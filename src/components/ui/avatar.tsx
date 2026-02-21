import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null
    alt?: string
    fallback?: string
    size?: "sm" | "md" | "lg" | "xl"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
        const sizeClasses = {
            sm: "h-8 w-8 text-xs",
            md: "h-10 w-10 text-sm",
            lg: "h-16 w-16 text-xl",
            xl: "h-24 w-24 text-3xl",
        }

        const [error, setError] = React.useState(false)

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex shrink-0 overflow-hidden rounded-full bg-gray-100 items-center justify-center font-semibold text-gray-600 uppercase border border-gray-200 shadow-sm",
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {src && !error ? (
                    <img
                        src={src}
                        alt={alt}
                        className="aspect-square h-full w-full object-cover"
                        onError={() => setError(true)}
                    />
                ) : (
                    <span className="select-none">{fallback?.substring(0, 2) || "?"}</span>
                )}
            </div>
        )
    }
)
Avatar.displayName = "Avatar"

export { Avatar }
