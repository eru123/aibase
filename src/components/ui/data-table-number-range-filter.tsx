import * as React from "react"
import { Hash } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/components/ui/lib/utils"

interface DataTableNumberRangeFilterProps {
    title?: string
    value?: [number | undefined, number | undefined]
    onChange?: (value: [number | undefined, number | undefined]) => void
}

export function DataTableNumberRangeFilter({
    title,
    value,
    onChange,
}: DataTableNumberRangeFilterProps) {
    const [min, setMin] = React.useState<string>(value?.[0]?.toString() ?? "")
    const [max, setMax] = React.useState<string>(value?.[1]?.toString() ?? "")
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        setMin(value?.[0]?.toString() ?? "")
        setMax(value?.[1]?.toString() ?? "")
        setError(null)
    }, [value])

    const parseNumber = (rawValue: string) => {
        const trimmed = rawValue.trim()
        if (trimmed === "") return undefined
        const parsed = Number(trimmed)
        if (!Number.isFinite(parsed)) return undefined
        return parsed
    }

    const commitValues = (nextMin: string, nextMax: string) => {
        const minVal = parseNumber(nextMin)
        const maxVal = parseNumber(nextMax)

        if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
            setError("Min cannot be greater than Max")
            return
        }

        setError(null)
        onChange?.([minVal, maxVal])
    }

    const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextMin = event.target.value
        setMin(nextMin)
        commitValues(nextMin, max)
    }

    const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextMax = event.target.value
        setMax(nextMax)
        commitValues(min, nextMax)
    }

    return (
        <div className="flex flex-col gap-1">
            <div
                className={cn(
                    "flex h-8 items-center rounded-md border border-dashed bg-background px-2 text-sm",
                    error ? "border-red-500" : "border-border"
                )}
            >
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="mr-2 text-xs font-medium text-muted-foreground">
                    {title}
                </span>
                <div className="flex items-center">
                    <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="Min"
                        value={min}
                        onChange={handleMinChange}
                        className="h-7 w-20 border-0 bg-transparent px-1 py-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <span className="px-1 text-muted-foreground">-</span>
                    <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="Max"
                        value={max}
                        onChange={handleMaxChange}
                        className="h-7 w-20 border-0 bg-transparent px-1 py-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
            </div>
            <div className="h-5">
                {error && <p className="text-[11px] text-red-500 leading-none">{error}</p>}
            </div>
        </div>
    )
}
