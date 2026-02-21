import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui"
import countryCodes from "@srcjson/countries-code.json"

export interface PhoneInputProps {
    value?: string
    onChange: (value: string) => void
    className?: string
    id?: string
}

export function PhoneInput({ value = "", onChange, className, id }: PhoneInputProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedCode, setSelectedCode] = React.useState("+1")
    const [phoneNumber, setPhoneNumber] = React.useState("")

    React.useEffect(() => {
        // Parse value to split code and number
        if (value) {
            // Find the code that matches the start of the value
            // Sort by length desc to match longest prefix first
            const sortedCodes = [...countryCodes].sort((a, b) => b.dial_code.length - a.dial_code.length)
            const matched = sortedCodes.find(c => value.startsWith(c.dial_code))

            if (matched) {
                setSelectedCode(matched.dial_code)
                setPhoneNumber(value.slice(matched.dial_code.length).trim())
            } else {
                setPhoneNumber(value)
            }
        } else {
            setPhoneNumber("")
        }
    }, [value])

    const handleCodeChange = (code: string) => {
        setSelectedCode(code)
        setOpen(false)
        onChange(`${code} ${phoneNumber}`)
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value
        setPhoneNumber(newNumber)
        onChange(`${selectedCode} ${newNumber}`)
    }

    return (
        <div className={cn("flex gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-fit justify-between"
                    >
                        {selectedCode}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-[300px]">
                                    {countryCodes.map((country) => (
                                        <CommandItem
                                            key={`${country.code}-${country.dial_code}`}
                                            value={`${country.name} ${country.dial_code}`}
                                            onSelect={() => handleCodeChange(country.dial_code)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCode === country.dial_code ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{country.name}</span>
                                                <span className="text-muted-foreground text-xs">{country.dial_code}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <Input
                id={id}
                value={phoneNumber}
                onChange={handleNumberChange}
                placeholder="Phone number"
                className="flex-1"
            />
        </div>
    )
}
