import * as React from "react"

export interface DropdownOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string | string[] | null
  defaultValue?: string | string[]
  onChange?: (nextValue: string | string[]) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  multiple?: boolean
  noResultsText?: string
  className?: string
  maxVisibleOptions?: number
  renderValue?: (selected: DropdownOption[], multiple: boolean) => React.ReactNode
  name?: string
}

const STYLE_ID = "ui-dropdown-styles"

const ensureStylesInjected = () => {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    .ui-dropdown {
      position: relative;
      width: 100%;
      font-family: inherit;
      color: #111827;
    }

    .ui-dropdown[aria-disabled="true"] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .ui-dropdown-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background-color: #ffffff;
      box-sizing: border-box;
      font-size: 14px;
      line-height: 1.4;
      cursor: pointer;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .ui-dropdown-toggle:focus-visible {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .ui-dropdown-toggle-disabled {
      cursor: not-allowed;
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .ui-dropdown-toggle-text {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      color: inherit;
    }

    .ui-dropdown-placeholder {
      color: #9ca3af;
    }

    .ui-dropdown-chevron {
      margin-left: 8px;
      font-size: 12px;
      color: #6b7280;
      transition: transform 0.18s ease;
    }

    .ui-dropdown-chevron-open {
      transform: rotate(180deg);
    }

    .ui-dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 100%;
      width: max-content;
      max-width: 320px;
      background-color: #ffffff;
      border: 1px solid rgba(17, 24, 39, 0.08);
      border-radius: 8px;
      box-shadow: 0 18px 40px -12px rgba(15, 23, 42, 0.18);
      box-sizing: border-box;
      padding: 8px 0;
      z-index: 1000;
      opacity: 0;
      transform: translateY(-6px);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      background-clip: padding-box;
    }

    .ui-dropdown-menu-open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .ui-dropdown-search-container {
      padding: 0 12px 8px 12px;
      border-bottom: 1px solid rgba(209, 213, 219, 0.6);
      margin-bottom: 6px;
    }

    .ui-dropdown-search {
      width: 100%;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid rgba(209, 213, 219, 0.9);
      background-color: #f9fafb;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .ui-dropdown-search:focus-visible {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
      background-color: #ffffff;
    }

    .ui-dropdown-options {
      max-height: var(--ui-dropdown-max-height, 240px);
      overflow-y: auto;
      padding: 4px 0;
      margin: 0;
      list-style: none;
    }

    .ui-dropdown-option {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 16px;
      font-size: 14px;
      line-height: 1.35;
      color: #111827;
      background-color: transparent;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .ui-dropdown-option-description {
      display: block;
      font-size: 12px;
      line-height: 1.3;
      color: #6b7280;
      margin-top: 2px;
    }

    .ui-dropdown-option:hover,
    .ui-dropdown-option-highlighted {
      background-color: rgba(37, 99, 235, 0.08);
      color: #1f2937;
    }

    .ui-dropdown-option[aria-disabled="true"] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ui-dropdown-option-selected::before {
      content: "";
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      margin-top: 6px;
      background-color: #2563eb;
    }

    .ui-dropdown-option-multiple-marker {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 2px solid rgba(37, 99, 235, 0.4);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .ui-dropdown-option-multiple-selected {
      background-color: rgba(37, 99, 235, 0.08);
      border-color: #2563eb;
    }

    .ui-dropdown-option-multiple-selected::after {
      content: "";
      width: 6px;
      height: 6px;
      background-color: #2563eb;
      border-radius: 2px;
    }

    .ui-dropdown-no-results {
      padding: 16px;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }

    .ui-dropdown-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .ui-dropdown-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      font-size: 12px;
      line-height: 1.2;
      border-radius: 9999px;
      background-color: rgba(37, 99, 235, 0.12);
      color: #1d4ed8;
    }
  `

  document.head.appendChild(style)
}

const normalizeToArray = (value: string | string[] | null | undefined, multiple: boolean): string[] => {
  if (!multiple) {
    if (typeof value === "string") return [value]
    return []
  }

  if (Array.isArray(value)) return value
  if (typeof value === "string" && value.length > 0) return [value]
  return []
}

const mergeRefs = <T,>(...refs: Array<React.Ref<T> | undefined>) => {
  return (value: T) => {
    refs.forEach((ref) => {
      if (!ref) return
      if (typeof ref === "function") {
        ref(value)
      } else {
        try {
          ;(ref as any).current = value
        } catch {
          // noop
        }
      }
    })
  }
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Select",
      disabled = false,
      searchable = false,
      multiple = false,
      noResultsText = "No results found",
      className = "",
      maxVisibleOptions = 8,
      renderValue,
      name,
    },
    forwardedRef
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState<string | string[] | null>(() => {
      if (defaultValue !== undefined) {
        return Array.isArray(defaultValue) ? defaultValue : defaultValue ?? null
      }
      return multiple ? [] : null
    })

    const resolvedValue = isControlled ? value ?? (multiple ? [] : null) : internalValue
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      ensureStylesInjected()
    }, [])

    const combinedRef = React.useMemo(() => mergeRefs<HTMLDivElement>(forwardedRef, containerRef), [forwardedRef])

    const selectedValues = React.useMemo(() => normalizeToArray(resolvedValue, multiple), [resolvedValue, multiple])
    const selectedOptions = React.useMemo(
      () => options.filter((option) => selectedValues.includes(option.value)),
      [options, selectedValues]
    )

    const emitChange = React.useCallback(
      (next: string | string[]) => {
        if (!isControlled) {
          setInternalValue(next)
        }
        onChange?.(next)
      },
      [isControlled, onChange]
    )

    const toggleOpen = React.useCallback(() => {
      if (disabled) return
      setIsOpen((previous) => !previous)
    }, [disabled])

    const closeMenu = React.useCallback(() => {
      setIsOpen(false)
      setSearchTerm("")
      setHighlightedIndex(-1)
    }, [])

    const handleClickOutside = React.useCallback(
      (event: MouseEvent) => {
        const root = containerRef.current
        if (!root) return
        if (event.target instanceof Node && root.contains(event.target)) {
          return
        }
        closeMenu()
      },
      [closeMenu]
    )

    React.useEffect(() => {
      if (!isOpen) return
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [handleClickOutside, isOpen])

    React.useEffect(() => {
      if (isOpen && searchable) {
        searchInputRef.current?.focus({ preventScroll: true })
      }
    }, [isOpen, searchable])

    const filteredOptions = React.useMemo(() => {
      if (!searchable || searchTerm.trim() === "") return options
      const term = searchTerm.trim().toLowerCase()
      return options.filter((option) => {
        const haystack = `${option.label} ${option.description ?? ""}`.toLowerCase()
        return haystack.includes(term)
      })
    }, [options, searchable, searchTerm])

    React.useEffect(() => {
      if (!isOpen) return
      const firstEnabledIndex = filteredOptions.findIndex((option) => !option.disabled)
      setHighlightedIndex(firstEnabledIndex)
    }, [filteredOptions, isOpen])

    const handleOptionSelect = React.useCallback(
      (option: DropdownOption) => {
        if (option.disabled || disabled) return

        if (multiple) {
          const current = normalizeToArray(resolvedValue, true)
          const exists = current.includes(option.value)
          const nextValues = exists
            ? current.filter((value) => value !== option.value)
            : [...current, option.value]
          emitChange(nextValues)
        } else {
          emitChange(option.value)
          closeMenu()
        }
      },
      [closeMenu, disabled, emitChange, multiple, resolvedValue]
    )

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return

        if (event.key === "ArrowDown") {
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            return
          }
          setHighlightedIndex((previous) => {
            let next = previous
            for (let i = 0; i < filteredOptions.length; i++) {
              next = (previous + 1 + i) % filteredOptions.length
              if (!filteredOptions[next]?.disabled) {
                break
              }
            }
            return next
          })
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            return
          }
          setHighlightedIndex((previous) => {
            let next = previous
            for (let i = 0; i < filteredOptions.length; i++) {
              next = (previous - 1 - i + filteredOptions.length) % filteredOptions.length
              if (!filteredOptions[next]?.disabled) {
                break
              }
            }
            return next
          })
        } else if (event.key === "Escape") {
          if (isOpen) {
            event.preventDefault()
            closeMenu()
          }
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            return
          }
          const option = filteredOptions[highlightedIndex]
          if (option && !option.disabled) {
            handleOptionSelect(option)
          }
        }
      },
      [closeMenu, disabled, filteredOptions, handleOptionSelect, highlightedIndex, isOpen]
    )

    const menuId = React.useId()

    const renderToggleValue = () => {
      if (renderValue) return renderValue(selectedOptions, multiple)
      if (multiple) {
        if (selectedOptions.length === 0) return <span className="ui-dropdown-placeholder">{placeholder}</span>
        return (
          <div className="ui-dropdown-tags">
            {selectedOptions.map((option) => (
              <span key={option.value} className="ui-dropdown-tag">
                {option.label}
              </span>
            ))}
          </div>
        )
      }

      if (selectedOptions.length === 0) {
        return <span className="ui-dropdown-placeholder">{placeholder}</span>
      }

      return <span>{selectedOptions[0].label}</span>
    }

    const resolvedMaxHeight = Math.max(1, Math.floor(maxVisibleOptions)) * 40
    const optionsListStyle = React.useMemo<React.CSSProperties>(
      () => ({
        ["--ui-dropdown-max-height" as any]: `${resolvedMaxHeight}px`,
      }),
      [resolvedMaxHeight]
    )

    return (
      <div
        ref={combinedRef}
        className={`ui-dropdown ${className}`.trim()}
        aria-disabled={disabled}
        data-open={isOpen ? "true" : "false"}
      >
        <button
          type="button"
          className={`ui-dropdown-toggle${disabled ? " ui-dropdown-toggle-disabled" : ""}`}
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          disabled={disabled}
          name={name}
        >
          <span className="ui-dropdown-toggle-text">{renderToggleValue()}</span>
          <span className={`ui-dropdown-chevron${isOpen ? " ui-dropdown-chevron-open" : ""}`} aria-hidden="true">
            ▼
          </span>
        </button>

        <div
          id={menuId}
          role="listbox"
          className={`ui-dropdown-menu${isOpen ? " ui-dropdown-menu-open" : ""}`}
          style={{
            visibility: isOpen ? "visible" : "hidden",
            maxHeight: `${resolvedMaxHeight}px`,
          }}
        >
          {searchable && (
            <div className="ui-dropdown-search-container">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search..."
                className="ui-dropdown-search"
              />
            </div>
          )}

          <ul className="ui-dropdown-options" style={optionsListStyle}>
            {filteredOptions.length === 0 && (
              <li className="ui-dropdown-no-results">{noResultsText}</li>
            )}

            {filteredOptions.map((option, index) => {
              const isSelected = selectedValues.includes(option.value)
              const isHighlighted = index === highlightedIndex
              const optionClasses = ["ui-dropdown-option"]

              if (isSelected && !multiple) {
                optionClasses.push("ui-dropdown-option-selected")
              }

              if (isHighlighted) {
                optionClasses.push("ui-dropdown-option-highlighted")
              }

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  className={optionClasses.join(" ")}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleOptionSelect(option)}
                >
                  {multiple ? (
                    <span
                      className={`ui-dropdown-option-multiple-marker${isSelected ? " ui-dropdown-option-multiple-selected" : ""}`}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="ui-dropdown-option-description">{option.description}</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }
)

Dropdown.displayName = "Dropdown"

export default Dropdown
