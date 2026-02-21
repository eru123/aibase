import * as React from "react"
import { Check, PlusCircle, Search } from "lucide-react"

import { cn } from "@/components/ui/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface DataTableFacetedFilterProps<TData, TValue> {
    title?: string
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
    selectedValues?: Set<string>
    onSelect?: (values: Set<string>) => void
}

export function DataTableFacetedFilter<TData, TValue>({
    title,
    options,
    selectedValues,
    onSelect,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const [searchValue, setSearchValue] = React.useState("")
    const selected = selectedValues || new Set()

    const handleSelect = (value: string) => {
        const newSelected = new Set(selected)
        if (newSelected.has(value)) {
            newSelected.delete(value)
        } else {
            newSelected.add(value)
        }
        onSelect?.(newSelected)
    }

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-1">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {title}
                        {selected.size > 0 && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <Badge
                                    variant="subtle"
                                    className="rounded-sm px-1 font-normal lg:hidden"
                                >
                                    {selected.size}
                                </Badge>
                                <div className="hidden space-x-1 lg:flex">
                                    {selected.size > 2 ? (
                                        <Badge
                                            variant="subtle"
                                            className="rounded-sm px-1 font-normal"
                                        >
                                            {selected.size} selected
                                        </Badge>
                                    ) : (
                                        options
                                            .filter((option) => selected.has(option.value))
                                            .map((option) => (
                                                <Badge
                                                    variant="subtle"
                                                    key={option.value}
                                                    className="rounded-sm px-1 font-normal"
                                                >
                                                    {option.label}
                                                </Badge>
                                            ))
                                    )}
                                </div>
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-1">
                        <div className="flex items-center border-b px-2 pb-1 relative">
                            <Search className="mr-2 h-4 w-4 opacity-50 absolute left-2 top-2.5" />
                            <Input
                                placeholder={title}
                                className="h-8 border-none focus-visible:ring-0 pl-8"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto mt-1">
                            {filteredOptions.length === 0 && (
                                <p className="p-2 text-sm text-muted-foreground text-center">No results found.</p>
                            )}
                            {filteredOptions.map((option) => {
                                const isSelected = selected.has(option.value)
                                return (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        )}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {selected.size > 0 && (
                        <>
                            <Separator />
                            <div className="p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-2 py-1 text-xs justify-center font-normal"
                                    onClick={() => onSelect?.(new Set())}
                                >
                                    Clear filters
                                </Button>
                            </div>
                        </>
                    )}
                </PopoverContent>
            </Popover>
            <div className="h-5" aria-hidden="true" />
        </div>
    )
}
