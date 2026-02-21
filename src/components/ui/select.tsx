"use client"

import * as React from "react"

const STYLE_ID = "ui-select-styles"

const ensureStylesInjected = () => {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    .ui-select {
      position: relative;
      width: 100%;
      font-family: inherit;
      color: #111827;
    }

    .ui-select[data-open="true"] .ui-select-icon {
      transform: rotate(180deg);
    }

    .ui-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background-color: #ffffff;
      color: inherit;
      font-size: 14px;
      line-height: 1.4;
      cursor: pointer;
      transition: border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease, background-color 0.18s ease;
    }

    .ui-select-trigger:focus-visible {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .ui-select-trigger[disabled],
    .ui-select[aria-disabled="true"] .ui-select-trigger {
      cursor: not-allowed;
      opacity: 0.6;
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .ui-select-trigger-text {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      color: inherit;
    }

    .ui-select-value {
      flex: 1;
      display: inline-flex;
      align-items: center;
      min-width: 0;
      font-weight: 500;
      color: inherit;
    }

    .ui-select-value[data-placeholder="true"] {
      color: #9ca3af;
      font-weight: 400;
    }

    .ui-select-placeholder {
      color: #9ca3af;
      font-weight: 400;
    }

    .ui-select-icon {
      margin-left: 8px;
      font-size: 12px;
      color: #6b7280;
      transition: transform 0.18s ease;
    }

    .ui-select-content {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 100%;
      max-width: 320px;
      background-color: #ffffff;
      border: 1px solid rgba(17, 24, 39, 0.1);
      border-radius: 8px;
      box-shadow: 0 18px 40px -12px rgba(15, 23, 42, 0.18);
      padding: 6px 0;
      box-sizing: border-box;
      z-index: 1000;
      opacity: 0;
      transform: translateY(-6px);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .ui-select-content[data-open="true"] {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .ui-select-options {
      max-height: var(--ui-select-max-height, 280px);
      overflow-y: auto;
      padding: 4px 0;
      margin: 0;
      list-style: none;
    }

    .ui-select-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 14px;
      line-height: 1.4;
      color: #111827;
      cursor: pointer;
      transition: background-color 0.18s ease, color 0.18s ease;
    }

    .ui-select-option::before {
      content: "";
      flex-shrink: 0;
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background-color: transparent;
      margin-right: 2px;
    }

    .ui-select-option[data-selected="true"]::before {
      background-color: #2563eb;
    }

    .ui-select-option[data-selected="true"] {
      font-weight: 600;
    }

    .ui-select-option[data-focused="true"],
    .ui-select-option:hover {
      background-color: rgba(37, 99, 235, 0.08);
      color: #1f2937;
    }

    .ui-select-option[data-disabled="true"] {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: transparent;
      color: #6b7280;
    }

    .ui-select-option[data-disabled="true"]:hover {
      background-color: transparent;
      color: #6b7280;
    }

    .ui-select-group {
      padding: 4px 0;
    }

    .ui-select-label {
      padding: 8px 16px 4px 16px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .ui-select-separator {
      height: 1px;
      margin: 4px 0;
      background-color: rgba(209, 213, 219, 0.9);
    }

    .ui-select-empty {
      padding: 12px 16px;
      font-size: 13px;
      color: #6b7280;
      text-align: left;
    }

    .ui-select-scroll-button {
      display: none;
    }
  `

  document.head.appendChild(style)
}

const classNames = (...values: Array<string | undefined | null | false>) =>
  values.filter(Boolean).join(" ")

const escapeAttributeSelector = (value: string) => {
  if (typeof window !== "undefined" && typeof (window as any).CSS !== "undefined" && typeof (window as any).CSS.escape === "function") {
    return (window as any).CSS.escape(value)
  }

  return value.replace(/["\\]/g, "\\$&")
}

const getTextContent = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join("")
  if (React.isValidElement(node)) return getTextContent(node.props.children)
  return ""
}

const mergeRefs = <T,>(...refs: Array<React.Ref<T> | undefined>) => {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return
      if (typeof ref === "function") {
        ref(value)
      } else {
        try {
          ;(ref as React.MutableRefObject<T | null>).current = value
        } catch {
          // noop
        }
      }
    })
  }
}

interface SelectOptionRecord {
  value: string
  label: React.ReactNode
  textValue: string
  disabled?: boolean
  id: string
}

interface SelectContextValue {
  value?: string
  setValue: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
  triggerRef: React.RefObject<HTMLButtonElement>
  contentRef: React.RefObject<HTMLDivElement>
  containerRef: React.RefObject<HTMLDivElement>
  registerOption: (option: SelectOptionRecord) => void
  unregisterOption: (value: string) => void
  getOption: (value?: string) => SelectOptionRecord | undefined
  focusedValue: string | null
  setFocusedValue: (value: string | null) => void
  focusFirst: () => void
  focusLast: () => void
  focusNext: () => void
  focusPrevious: () => void
  selectFocused: () => void
  name?: string
  baseId: string
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within <Select>")
  }
  return context
}

const focusTrigger = (trigger?: HTMLButtonElement | null) => {
  if (!trigger) return
  if (typeof trigger.focus === "function") {
    trigger.focus({ preventScroll: true })
  }
}

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  children?: React.ReactNode
  name?: string
  className?: string
  style?: React.CSSProperties
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      open,
      defaultOpen = false,
      onOpenChange,
      disabled = false,
      children,
      name,
      className,
      style,
    },
    forwardedRef
  ) => {
    React.useEffect(() => {
      ensureStylesInjected()
    }, [])

    const isValueControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue)
    const resolvedValue = React.useMemo(
      () => (isValueControlled ? value : internalValue),
      [isValueControlled, value, internalValue]
    )

    const isOpenControlled = open !== undefined
    const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen)
    const resolvedOpen = isOpenControlled ? !!open : internalOpen

    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const optionsRef = React.useRef<Map<string, SelectOptionRecord>>(new Map())
    const [focusedValue, setFocusedValue] = React.useState<string | null>(null)
    const baseId = React.useId()

    const registerOption = React.useCallback((option: SelectOptionRecord) => {
      optionsRef.current.set(option.value, option)
    }, [])

    const unregisterOption = React.useCallback((optionValue: string) => {
      optionsRef.current.delete(optionValue)
    }, [])

    const getOption = React.useCallback((optionValue?: string) => {
      if (!optionValue) return undefined
      return optionsRef.current.get(optionValue)
    }, [])

    const setValueInternal = React.useCallback(
      (nextValue: string) => {
        if (!isValueControlled) {
          setInternalValue(nextValue)
        }
        onValueChange?.(nextValue)
      },
      [isValueControlled, onValueChange]
    )

    const setOpenInternal = React.useCallback(
      (nextOpen: boolean) => {
        if (!isOpenControlled) {
          setInternalOpen(nextOpen)
        }
        onOpenChange?.(nextOpen)
        if (!nextOpen) {
          setFocusedValue(null)
        }
      },
      [isOpenControlled, onOpenChange]
    )

    const getEnabledItems = React.useCallback(() => {
      const contentElement = contentRef.current
      if (!contentElement) return []
      const elements = Array.from(contentElement.querySelectorAll<HTMLElement>("[data-select-item=\"true\"]"))
      return elements
        .map((element) => {
          const optionValue = element.getAttribute("data-value")
          if (!optionValue) return null
          const option = optionsRef.current.get(optionValue)
          if (!option || option.disabled) return null
          return { value: optionValue, element }
        })
        .filter((item): item is { value: string; element: HTMLElement } => item !== null)
    }, [])

    const focusValue = React.useCallback((nextValue: string | null) => {
      if (!nextValue) return
      setFocusedValue(nextValue)
      const selector = `[data-select-item="true"][data-value="${escapeAttributeSelector(nextValue)}"]`
      const element = contentRef.current?.querySelector<HTMLElement>(selector)
      if (element) {
        element.scrollIntoView({ block: "nearest" })
      }
    }, [])

    const focusFirst = React.useCallback(() => {
      const items = getEnabledItems()
      if (!items.length) return
      focusValue(items[0].value)
    }, [focusValue, getEnabledItems])

    const focusLast = React.useCallback(() => {
      const items = getEnabledItems()
      if (!items.length) return
      focusValue(items[items.length - 1].value)
    }, [focusValue, getEnabledItems])

    const focusNext = React.useCallback(() => {
      const items = getEnabledItems()
      if (!items.length) return
      const current = focusedValue ?? resolvedValue ?? null
      const currentIndex = current ? items.findIndex((item) => item.value === current) : -1
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length
      focusValue(items[nextIndex].value)
    }, [focusValue, focusedValue, getEnabledItems, resolvedValue])

    const focusPrevious = React.useCallback(() => {
      const items = getEnabledItems()
      if (!items.length) return
      const current = focusedValue ?? resolvedValue ?? null
      const currentIndex = current ? items.findIndex((item) => item.value === current) : -1
      const nextIndex = currentIndex === -1 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length
      focusValue(items[nextIndex].value)
    }, [focusValue, focusedValue, getEnabledItems, resolvedValue])

    const selectFocused = React.useCallback(() => {
      if (!focusedValue) return
      setValueInternal(focusedValue)
      setOpenInternal(false)
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => focusTrigger(triggerRef.current))
      }
    }, [focusedValue, setOpenInternal, setValueInternal])

    React.useEffect(() => {
      if (!resolvedOpen) return
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node | null
        if (!containerRef.current || !target) return
        if (!containerRef.current.contains(target)) {
          setOpenInternal(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [resolvedOpen, setOpenInternal])

    React.useEffect(() => {
      if (!resolvedOpen) return
      const selection = resolvedValue && optionsRef.current.has(resolvedValue) ? resolvedValue : null
      const fallback = selection ?? getEnabledItems()[0]?.value ?? null
      if (!focusedValue && fallback) {
        focusValue(fallback)
      }

      if (contentRef.current) {
        contentRef.current.focus({ preventScroll: true })
      }
    }, [resolvedOpen, resolvedValue, focusValue, getEnabledItems, focusedValue])

    const contextValue = React.useMemo<SelectContextValue>(
      () => ({
        value: resolvedValue,
        setValue: setValueInternal,
        open: resolvedOpen,
        setOpen: setOpenInternal,
        disabled,
        triggerRef,
        contentRef,
        containerRef,
        registerOption,
        unregisterOption,
        getOption,
        focusedValue,
        setFocusedValue,
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        selectFocused,
        name,
        baseId,
      }),
      [
        resolvedValue,
        setValueInternal,
        resolvedOpen,
        setOpenInternal,
        disabled,
        registerOption,
        unregisterOption,
        getOption,
        focusedValue,
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        selectFocused,
        name,
        baseId,
      ]
    )

    return (
      <SelectContext.Provider value={contextValue}>
        <div
          ref={mergeRefs(forwardedRef, containerRef)}
          className={classNames("ui-select", className)}
          aria-disabled={disabled ? "true" : undefined}
          data-open={resolvedOpen ? "true" : "false"}
          style={style}
        >
          {children}
          {name ? <input type="hidden" name={name} value={resolvedValue ?? ""} disabled={disabled} /> : null}
        </div>
      </SelectContext.Provider>
    )
  }
)

Select.displayName = "Select"

export type SelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, onClick, onKeyDown, disabled: disabledProp, ...props }, forwardedRef) => {
    const {
      open,
      setOpen,
      disabled,
      focusFirst,
      focusLast,
      focusNext,
      focusPrevious,
      selectFocused,
      triggerRef,
    } = useSelectContext()

    const effectiveDisabled = disabled || disabledProp
    const combinedRef = React.useMemo(() => mergeRefs(forwardedRef, triggerRef), [forwardedRef, triggerRef])

    const handleToggle = React.useCallback(() => {
      if (effectiveDisabled) return
      setOpen(!open)
    }, [effectiveDisabled, open, setOpen])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (effectiveDisabled) return
        if (event.key === "ArrowDown") {
          event.preventDefault()
          if (!open) {
            setOpen(true)
            focusFirst()
            return
          }
          focusNext()
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          if (!open) {
            setOpen(true)
            focusLast()
            return
          }
          focusPrevious()
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          if (!open) {
            setOpen(true)
            focusFirst()
            return
          }
          selectFocused()
        } else if (event.key === "Escape") {
          if (open) {
            event.preventDefault()
            setOpen(false)
          }
        }
      },
      [effectiveDisabled, focusFirst, focusLast, focusNext, focusPrevious, open, selectFocused, setOpen]
    )

    return (
      <button
        type="button"
        {...props}
        ref={combinedRef}
        className={classNames("ui-select-trigger", className)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={effectiveDisabled ? "true" : undefined}
        disabled={effectiveDisabled}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          handleToggle()
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          handleKeyDown(event)
        }}
      >
        <span className="ui-select-trigger-text">{children}</span>
        <span className="ui-select-icon" aria-hidden="true">
          ▼
        </span>
      </button>
    )
  }
)

SelectTrigger.displayName = "SelectTrigger"

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: React.ReactNode
}

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, children, ...props }, forwardedRef) => {
    const { value, getOption } = useSelectContext()
    const option = value ? getOption(value) : undefined

    const fallback = option ? null : children ?? placeholder

    const renderedFallback =
      fallback === undefined || fallback === null
        ? null
        : React.isValidElement(fallback)
        ? fallback
        : <span className="ui-select-placeholder">{fallback}</span>

    return (
      <span
        {...props}
        ref={forwardedRef}
        className={classNames("ui-select-value", className)}
        data-placeholder={option ? "false" : "true"}
      >
        {option ? option.label : renderedFallback}
      </span>
    )
  }
)

SelectValue.displayName = "SelectValue"

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  maxVisibleItems?: number
  emptyText?: React.ReactNode
}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, style, maxVisibleItems = 7, emptyText, onKeyDown, ...props }, forwardedRef) => {
    const {
      open,
      contentRef,
      focusFirst,
      focusLast,
      focusNext,
      focusPrevious,
      selectFocused,
      focusedValue,
      getOption,
    } = useSelectContext()

    const combinedRef = React.useMemo(() => mergeRefs(forwardedRef, contentRef), [forwardedRef, contentRef])

    const activeId = focusedValue ? getOption(focusedValue)?.id : undefined

    const calculatedStyle = React.useMemo<React.CSSProperties>(
      () => ({
        ...style,
        ["--ui-select-max-height" as any]: `${Math.max(3, Math.floor(maxVisibleItems)) * 40}px`,
      }),
      [style, maxVisibleItems]
    )

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowDown") {
          event.preventDefault()
          focusNext()
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          focusPrevious()
        } else if (event.key === "Home") {
          event.preventDefault()
          focusFirst()
        } else if (event.key === "End") {
          event.preventDefault()
          focusLast()
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          selectFocused()
        } else if (event.key === "Tab") {
          event.preventDefault()
          selectFocused()
        }
      },
      [focusFirst, focusLast, focusNext, focusPrevious, selectFocused]
    )

    const hasChildren = React.Children.count(children) > 0

    return (
      <div
        {...props}
        ref={combinedRef}
        className={classNames("ui-select-content", className)}
        data-open={open ? "true" : "false"}
        tabIndex={-1}
        role="listbox"
        aria-hidden={open ? "false" : "true"}
        aria-activedescendant={open ? activeId : undefined}
        style={calculatedStyle}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (!event.defaultPrevented) {
            handleKeyDown(event)
          }
        }}
      >
        <div className="ui-select-options">
          {hasChildren ? children : emptyText ? (
            <div className="ui-select-empty">{emptyText}</div>
          ) : null}
        </div>
      </div>
    )
  }
)

SelectContent.displayName = "SelectContent"

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
  textValue?: string
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, disabled = false, textValue, className, children, onClick, onMouseEnter, ...props }, forwardedRef) => {
    const {
      value: selectedValue,
      setValue,
      setOpen,
      registerOption,
      unregisterOption,
      focusedValue,
      setFocusedValue,
      triggerRef,
      baseId,
    } = useSelectContext()

    const itemRef = React.useRef<HTMLDivElement>(null)
    const combinedRef = React.useMemo(() => mergeRefs(forwardedRef, itemRef), [forwardedRef])
    const reactId = React.useId()
    const optionId = `${baseId}-option-${reactId}`

    const optionText = React.useMemo(() => {
      const text = textValue ?? getTextContent(children)
      return text.length > 0 ? text : value
    }, [children, textValue, value])

    const optionLabel = React.useMemo(() => children, [children])

    React.useEffect(() => {
      registerOption({
        value,
        label: optionLabel,
        textValue: optionText,
        disabled,
        id: optionId,
      })
      return () => {
        unregisterOption(value)
      }
    }, [value, optionLabel, optionText, disabled, optionId, registerOption, unregisterOption])

    React.useEffect(() => {
      if (focusedValue === value) {
        itemRef.current?.scrollIntoView({ block: "nearest" })
      }
    }, [focusedValue, value])

    const isSelected = selectedValue === value
    const isFocused = focusedValue === value

    const handleSelect = () => {
      if (disabled) return
      setValue(value)
      setOpen(false)
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => focusTrigger(triggerRef.current))
      }
    }

    return (
      <div
        {...props}
        ref={combinedRef}
        id={optionId}
        role="option"
        tabIndex={-1}
        data-select-item="true"
        data-value={value}
        data-selected={isSelected ? "true" : undefined}
        data-focused={isFocused ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
        aria-selected={isSelected}
        aria-disabled={disabled}
        className={classNames(
          "ui-select-option",
          isSelected && "ui-select-option-selected",
          isFocused && "ui-select-option-focused",
          disabled && "ui-select-option-disabled",
          className
        )}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          handleSelect()
        }}
        onMouseEnter={(event) => {
          onMouseEnter?.(event)
          if (event.defaultPrevented || disabled) return
          setFocusedValue(value)
        }}
        onMouseDown={(event) => {
          event.preventDefault()
        }}
      >
        {children}
      </div>
    )
  }
)

SelectItem.displayName = "SelectItem"

export const SelectGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-select-group", className)} />
  )
)

SelectGroup.displayName = "SelectGroup"

export const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-select-label", className)} />
  )
)

SelectLabel.displayName = "SelectLabel"

export const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-select-separator", className)} />
  )
)

SelectSeparator.displayName = "SelectSeparator"

export const SelectScrollUpButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-select-scroll-button", className)} aria-hidden="true" />
  )
)

SelectScrollUpButton.displayName = "SelectScrollUpButton"

export const SelectScrollDownButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-select-scroll-button", className)} aria-hidden="true" />
  )
)

SelectScrollDownButton.displayName = "SelectScrollDownButton"
