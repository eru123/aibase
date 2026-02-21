import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/components/ui/lib/utils"

interface DataTableDateFilterProps {
    title?: string
    value?: [string | undefined, string | undefined] // ISO strings YYYY-MM-DD
    onChange?: (value: [string | undefined, string | undefined]) => void
}

export function DataTableDateFilter({
    title,
    value,
    onChange,
}: DataTableDateFilterProps) {
    const [start, setStart] = React.useState<string>(value?.[0] ?? "")
    const [end, setEnd] = React.useState<string>(value?.[1] ?? "")
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        setStart(value?.[0] ?? "")
        setEnd(value?.[1] ?? "")
        setError(null)
    }, [value])

    const commitValues = (nextStart: string, nextEnd: string) => {
        if (nextStart && nextEnd && nextStart > nextEnd) {
            setError("Start date cannot be after End date")
            return
        }

        setError(null)
        onChange?.([nextStart || undefined, nextEnd || undefined])
    }

    const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextStart = event.target.value
        setStart(nextStart)
        commitValues(nextStart, end)
    }

    const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextEnd = event.target.value
        setEnd(nextEnd)
        commitValues(start, nextEnd)
    }

    return (
        <div className="flex flex-col gap-1">
            <div
                className={cn(
                    "flex h-8 items-center rounded-md border bg-background px-2 text-sm",
                    error ? "border-red-500" : "border-border"
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="mr-2 text-xs font-medium text-muted-foreground">
                    {title}
                </span>
                <div className="flex items-center">
                    <Input
                        type="date"
                        value={start}
                        onChange={handleStartChange}
                        className="h-7 w-[128px] border-0 bg-transparent px-1 py-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <span className="px-1 text-muted-foreground">-</span>
                    <Input
                        type="date"
                        value={end}
                        onChange={handleEndChange}
                        className="h-7 w-[128px] border-0 bg-transparent px-1 py-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
            </div>
            <div className="h-5">
                {error && <p className="text-[11px] text-red-500 leading-none">{error}</p>}
            </div>
        </div>
    )
}
