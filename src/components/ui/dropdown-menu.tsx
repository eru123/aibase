"use client"

import * as React from "react"
import * as ReactDOM from "react-dom"

import {
  Menu,
  MenuProps,
  MenuItem,
  MenuItemProps,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuShortcut,
  MenuApi,
} from "./menu"

const STYLE_ID = "ui-dropdown-menu-styles"

const ensureStylesInjected = () => {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    .ui-dropdown-menu-trigger {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .ui-dropdown-menu-overlay {
      position: fixed;
      inset: 0;
      background-color: transparent;
    }

    .ui-dropdown-menu-content {
      position: absolute;
      z-index: 1200;
    }
  `

  document.head.appendChild(style)
}

type MenuLabelComponentProps = React.ComponentPropsWithoutRef<typeof MenuLabel>
type MenuGroupComponentProps = React.ComponentPropsWithoutRef<typeof MenuGroup>
type MenuSeparatorComponentProps = React.ComponentPropsWithoutRef<typeof MenuSeparator>
type MenuShortcutComponentProps = React.ComponentPropsWithoutRef<typeof MenuShortcut>

const mergeRefs = <T,>(...refs: Array<React.Ref<T> | undefined>) => {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return
      if (typeof ref === "function") {
        ref(value)
      } else {
        try {
          ; (ref as React.MutableRefObject<T | null>).current = value
        } catch {
          // noop
        }
      }
    })
  }
}

const positionMenu = (
  trigger: HTMLElement | null,
  content: HTMLElement | null,
  alignment: "start" | "center" | "end",
  side: "bottom" | "top" | "left" | "right",
  offset: number
) => {
  if (!trigger || !content) return
  const triggerRect = trigger.getBoundingClientRect()
  const contentRect = content.getBoundingClientRect()
  const spacing = offset

  let top = 0
  let left = 0

  if (side === "bottom") {
    top = triggerRect.bottom + spacing
  } else if (side === "top") {
    top = triggerRect.top - contentRect.height - spacing
  } else if (side === "left") {
    top = triggerRect.top
    left = triggerRect.left - contentRect.width - spacing
  } else if (side === "right") {
    top = triggerRect.top
    left = triggerRect.right + spacing
  }

  if (side === "bottom" || side === "top") {
    if (alignment === "start") {
      left = triggerRect.left
    } else if (alignment === "center") {
      left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2
    } else if (alignment === "end") {
      left = triggerRect.right - contentRect.width
    }
  } else {
    if (alignment === "start") {
      top = triggerRect.top
    } else if (alignment === "center") {
      top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2
    } else if (alignment === "end") {
      top = triggerRect.bottom - contentRect.height
    }
  }

  const { innerWidth, innerHeight } = window
  const padding = 8

  top = Math.max(padding, Math.min(innerHeight - contentRect.height - padding, top))
  left = Math.max(padding, Math.min(innerWidth - contentRect.width - padding, left))

  content.style.top = `${top + window.scrollY}px`
  content.style.left = `${left + window.scrollX}px`
}

export interface DropdownMenuContextValue {
  open: boolean
  setOpen: (next: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement>
  menuRef: React.RefObject<HTMLDivElement>
  menuApiRef: React.MutableRefObject<MenuApi | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

const useDropdownMenuContext = () => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("DropdownMenu components must be used within <DropdownMenu>")
  }
  return context
}

export interface DropdownMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "bottom" | "top" | "left" | "right"
  offset?: number
  closeOnSelect?: boolean
}

export const DropdownMenu = ({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  align = "start",
  side = "bottom",
  offset = 6,
}: DropdownMenuProps) => {
  React.useEffect(() => {
    ensureStylesInjected()
  }, [])

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const menuApiRef = React.useRef<MenuApi | null>(null)

  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const resolvedOpen = isControlled ? !!open : internalOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next)
      }
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const contextValue = React.useMemo<DropdownMenuContextValue>(
    () => ({
      open: resolvedOpen,
      setOpen,
      triggerRef,
      menuRef,
      menuApiRef,
    }),
    [resolvedOpen, setOpen]
  )

  React.useEffect(() => {
    if (!resolvedOpen) return undefined

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [resolvedOpen, setOpen])

  React.useEffect(() => {
    if (!resolvedOpen) return undefined
    const { current: trigger } = triggerRef
    const { current: content } = menuRef
    if (trigger && content) {
      positionMenu(trigger, content, align, side, offset)
    }
    return undefined
  }, [resolvedOpen, align, side, offset])

  React.useEffect(() => {
    const handler = () => {
      if (!resolvedOpen) return
      positionMenu(triggerRef.current, menuRef.current, align, side, offset)
    }
    window.addEventListener("resize", handler)
    window.addEventListener("scroll", handler, true)
    return () => {
      window.removeEventListener("resize", handler)
      window.removeEventListener("scroll", handler, true)
    }
  }, [resolvedOpen, align, side, offset])

  const clonedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    return child
  })

  return (
    <DropdownMenuContext.Provider value={contextValue}>{clonedChildren}</DropdownMenuContext.Provider>
  )
}

DropdownMenu.displayName = "DropdownMenu"

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, disabled = false, className, onClick, onKeyDown, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef, menuApiRef } = useDropdownMenuContext()
    const combinedRef = React.useMemo(() => mergeRefs(forwardedRef, triggerRef), [forwardedRef, triggerRef])

    const toggle = React.useCallback(() => {
      if (disabled) return
      setOpen(!open)
    }, [disabled, open, setOpen])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return
        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          if (!open) {
            setOpen(true)
            const api = menuApiRef.current
            if (event.key === "ArrowUp") {
              api?.focusLast()
            } else {
              api?.focusFirst()
            }
          } else if ((event.key === "ArrowDown" && event.altKey) || event.key === "Enter" || event.key === " ") {
            setOpen(false)
          }
        } else if (event.key === "Escape") {
          if (open) {
            event.preventDefault()
            setOpen(false)
          }
        }
      },
      [disabled, menuApiRef, open, setOpen]
    )

    return (
      <button
        type="button"
        {...props}
        ref={combinedRef}
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          toggle()
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          handleKeyDown(event)
        }}
        disabled={disabled}
      >
        {children}
      </button>
    )
  }
)

DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export interface DropdownMenuContentProps extends Omit<MenuProps, "registerApi" | "loop" | "inert"> {
  className?: string
  loop?: boolean
  inert?: boolean
  portal?: boolean
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  (
    { className, children, portal = false, loop = true, inert = false, focusOnRender = true, ...props },
    forwardedRef
  ) => {
    const { open, setOpen, triggerRef, menuRef, menuApiRef } = useDropdownMenuContext()

    const combinedRef = React.useMemo(() => mergeRefs(forwardedRef, menuRef), [forwardedRef, menuRef])

    React.useEffect(() => {
      if (!open) return undefined
      const trigger = triggerRef.current
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "ArrowDown" && event.altKey) {
          setOpen(false)
        }
      }
      trigger?.addEventListener("keydown", handleKeyDown)
      return () => trigger?.removeEventListener("keydown", handleKeyDown)
    }, [open, setOpen, triggerRef])

    const menuElement = (
      <div
        ref={menuRef}
        className="ui-dropdown-menu-content"
        style={{ display: open ? "block" : "none" }}
      >
        <Menu
          {...props}
          ref={forwardedRef}
          className={className}
          loop={loop}
          inert={inert}
          onClose={() => setOpen(false)}
          focusOnRender={focusOnRender}
          registerApi={(api) => {
            menuApiRef.current = api
          }}
        >
          {children}
        </Menu>
      </div>
    )

    if (portal) {
      if (typeof document === "undefined") {
        return menuElement
      }
      let portalContainer = document.getElementById("ui-dropdown-menu-portal")
      if (!portalContainer) {
        portalContainer = document.createElement("div")
        portalContainer.id = "ui-dropdown-menu-portal"
        document.body.appendChild(portalContainer)
      }
      return ReactDOM.createPortal(menuElement, portalContainer)
    }

    return menuElement
  }
)

DropdownMenuContent.displayName = "DropdownMenuContent"

export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>((props, ref) => {
  const { setOpen } = useDropdownMenuContext()
  return (
    <MenuItem
      {...props}
      ref={ref}
      onSelect={() => {
        props.onSelect?.()
        if (props.closeOnSelect !== false) {
          setOpen(false)
        }
      }}
    />
  )
})

DropdownMenuItem.displayName = "DropdownMenuItem"

export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, MenuLabelComponentProps>((props, ref) => (
  <MenuLabel {...props} ref={ref} />
))

DropdownMenuLabel.displayName = "DropdownMenuLabel"

export const DropdownMenuGroup = React.forwardRef<HTMLDivElement, MenuGroupComponentProps>((props, ref) => (
  <MenuGroup {...props} ref={ref} />
))

DropdownMenuGroup.displayName = "DropdownMenuGroup"

export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, MenuSeparatorComponentProps>((props, ref) => (
  <MenuSeparator {...props} ref={ref} />
))

DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export const DropdownMenuShortcut = React.forwardRef<HTMLSpanElement, MenuShortcutComponentProps>((props, ref) => (
  <MenuShortcut {...props} ref={ref} />
))

DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  Menu as BaseMenu,
  MenuItem as BaseMenuItem,
  MenuGroup as BaseMenuGroup,
  MenuLabel as BaseMenuLabel,
  MenuSeparator as BaseMenuSeparator,
  MenuShortcut as BaseMenuShortcut,
}
