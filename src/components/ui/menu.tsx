"use client"

import * as React from "react"

const STYLE_ID = "ui-menu-styles"

const ensureStylesInjected = () => {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    .ui-menu {
      min-width: 160px;
      padding: 6px 0;
      background-color: #ffffff;
      border: 1px solid rgba(17, 24, 39, 0.12);
      border-radius: 8px;
      box-shadow: 0 18px 40px -12px rgba(15, 23, 42, 0.18);
      box-sizing: border-box;
      color: #111827;
      outline: none;
    }

    .ui-menu[data-inert="true"] {
      pointer-events: none;
      opacity: 0.6;
    }

    .ui-menu-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 14px;
      font-size: 14px;
      line-height: 1.4;
      background: transparent;
      border: none;
      color: inherit;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .ui-menu-item[data-inset="true"] {
      padding-left: 32px;
    }

    .ui-menu-item:hover,
    .ui-menu-item[data-focused="true"] {
      background-color: rgba(37, 99, 235, 0.08);
      color: #1f2937;
    }

    .ui-menu-item:focus-visible {
      outline: none;
      background-color: rgba(37, 99, 235, 0.12);
      color: #1f2937;
    }

    .ui-menu-item[data-disabled="true"] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ui-menu-item[data-disabled="true"]:hover {
      background-color: transparent;
      color: inherit;
    }

    .ui-menu-label {
      padding: 8px 14px 4px 14px;
      font-size: 12px;
      line-height: 1.2;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.02em;
    }

    .ui-menu-separator {
      height: 1px;
      margin: 6px 0;
      background-color: rgba(209, 213, 219, 0.9);
    }

    .ui-menu-group {
      padding: 0;
      margin: 0;
    }

    .ui-menu-shortcut {
      margin-left: 16px;
      font-size: 12px;
      line-height: 1.2;
      color: #6b7280;
    }
  `

  document.head.appendChild(style)
}

const classNames = (...values: Array<string | undefined | null | false>) =>
  values.filter(Boolean).join(" ")

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

interface MenuItemRegistration {
  id: string
  ref: React.RefObject<HTMLButtonElement>
  disabled: boolean
  order: number
}

export interface MenuApi {
  focusFirst: () => void
  focusLast: () => void
  focusNext: () => void
  focusPrevious: () => void
  focusItem: (id: string) => void
  closeMenu: () => void
}

interface MenuContextValue {
  activeId: string | null
  registerItem: (item: Omit<MenuItemRegistration, "order">) => void
  unregisterItem: (id: string) => void
  focusItem: (id: string) => void
  focusFirst: () => void
  focusLast: () => void
  focusNext: () => void
  focusPrevious: () => void
  closeMenu: () => void
}

const MenuContext = React.createContext<MenuContextValue | null>(null)

const useMenuContext = () => {
  const context = React.useContext(MenuContext)
  if (!context) {
    throw new Error("Menu components must be used within <Menu>")
  }
  return context
}

export interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  loop?: boolean
  inert?: boolean
  onClose?: () => void
  focusOnRender?: boolean
  registerApi?: (api: MenuApi | null) => void
}

export const Menu = React.forwardRef<HTMLDivElement, MenuProps>(
  (
    { loop = true, inert = false, onClose, focusOnRender = false, registerApi, className, children, ...props },
    forwardedRef
  ) => {
    React.useEffect(() => {
      ensureStylesInjected()
    }, [])

    const containerRef = React.useRef<HTMLDivElement>(null)
    const itemsRef = React.useRef<MenuItemRegistration[]>([])
    const orderRef = React.useRef(0)
    const activeIdRef = React.useRef<string | null>(null)
    const [activeId, setActiveIdState] = React.useState<string | null>(null)

    const setActiveId = React.useCallback((id: string | null) => {
      activeIdRef.current = id
      setActiveIdState(id)
    }, [])

    const registerItem = React.useCallback(
      ({ id, ref, disabled }: Omit<MenuItemRegistration, "order">) => {
        const existingIndex = itemsRef.current.findIndex((entry) => entry.id === id)
        if (existingIndex >= 0) {
          itemsRef.current[existingIndex] = {
            ...itemsRef.current[existingIndex],
            ref,
            disabled,
          }
        } else {
          const newItem: MenuItemRegistration = {
            id,
            ref,
            disabled,
            order: orderRef.current++,
          }
          itemsRef.current = [...itemsRef.current, newItem].sort((a, b) => a.order - b.order)
          if (!activeIdRef.current && !disabled) {
            setActiveId(newItem.id)
          }
        }
      },
      [setActiveId]
    )

    const unregisterItem = React.useCallback(
      (id: string) => {
        itemsRef.current = itemsRef.current.filter((entry) => entry.id !== id)
        if (activeIdRef.current === id) {
          const fallback = itemsRef.current.find((entry) => !entry.disabled)
          setActiveId(fallback ? fallback.id : null)
        }
      },
      [setActiveId]
    )

    const getEnabledItems = React.useCallback(() => itemsRef.current.filter((entry) => !entry.disabled), [])

    const focusItem = React.useCallback(
      (id: string) => {
        const target = itemsRef.current.find((entry) => entry.id === id && !entry.disabled)
        if (!target) return
        setActiveId(id)
        if (target.ref.current && typeof target.ref.current.focus === "function") {
          target.ref.current.focus({ preventScroll: true })
        }
      },
      [setActiveId]
    )

    const focusFirst = React.useCallback(() => {
      const enabled = getEnabledItems()
      if (!enabled.length) return
      focusItem(enabled[0].id)
    }, [focusItem, getEnabledItems])

    const focusLast = React.useCallback(() => {
      const enabled = getEnabledItems()
      if (!enabled.length) return
      focusItem(enabled[enabled.length - 1].id)
    }, [focusItem, getEnabledItems])

    const focusNext = React.useCallback(() => {
      const enabled = getEnabledItems()
      if (!enabled.length) return
      const currentIndex = activeIdRef.current ? enabled.findIndex((entry) => entry.id === activeIdRef.current) : -1
      if (currentIndex === -1) {
        focusItem(enabled[0].id)
        return
      }
      const nextIndex = currentIndex + 1
      if (nextIndex >= enabled.length) {
        if (!loop) {
          focusItem(enabled[enabled.length - 1].id)
          return
        }
        focusItem(enabled[0].id)
        return
      }
      focusItem(enabled[nextIndex].id)
    }, [focusItem, getEnabledItems, loop])

    const focusPrevious = React.useCallback(() => {
      const enabled = getEnabledItems()
      if (!enabled.length) return
      const currentIndex = activeIdRef.current ? enabled.findIndex((entry) => entry.id === activeIdRef.current) : -1
      if (currentIndex === -1) {
        focusItem(enabled[enabled.length - 1].id)
        return
      }
      const previousIndex = currentIndex - 1
      if (previousIndex < 0) {
        if (!loop) {
          focusItem(enabled[0].id)
          return
        }
        focusItem(enabled[enabled.length - 1].id)
        return
      }
      focusItem(enabled[previousIndex].id)
    }, [focusItem, getEnabledItems, loop])

    const closeMenu = React.useCallback(() => {
      onClose?.()
    }, [onClose])

    React.useEffect(() => {
      if (focusOnRender) {
        if (typeof window !== "undefined") {
          const id = window.requestAnimationFrame(() => {
            if (activeIdRef.current) {
              focusItem(activeIdRef.current)
            } else {
              focusFirst()
            }
          })
          return () => window.cancelAnimationFrame(id)
        }
        focusFirst()
      }
      return undefined
    }, [focusOnRender, focusFirst, focusItem])

    React.useEffect(() => {
      if (!registerApi) return
      const api: MenuApi = {
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        focusItem,
        closeMenu,
      }
      registerApi(api)
      return () => registerApi(null)
    }, [registerApi, focusFirst, focusLast, focusNext, focusPrevious, focusItem, closeMenu])

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
        } else if (event.key === "Escape") {
          event.preventDefault()
          closeMenu()
        } else if (event.key === "Tab") {
          closeMenu()
        }
      },
      [closeMenu, focusFirst, focusLast, focusNext, focusPrevious]
    )

    const contextValue = React.useMemo<MenuContextValue>(
      () => ({
        activeId,
        registerItem,
        unregisterItem,
        focusItem,
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        closeMenu,
      }),
      [activeId, registerItem, unregisterItem, focusItem, focusFirst, focusLast, focusNext, focusPrevious, closeMenu]
    )

    return (
      <MenuContext.Provider value={contextValue}>
        <div
          {...props}
          ref={mergeRefs(forwardedRef, containerRef)}
          role="menu"
          tabIndex={-1}
          className={classNames("ui-menu", className)}
          data-inert={inert ? "true" : undefined}
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
      </MenuContext.Provider>
    )
  }
)

Menu.displayName = "Menu"

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean
  closeOnSelect?: boolean
  onSelect?: () => void
}

export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  (
    { inset = false, closeOnSelect = true, onSelect, className, disabled, onClick, onMouseEnter, onFocus, children, ...props },
    forwardedRef
  ) => {
    const { activeId, registerItem, unregisterItem, focusItem, closeMenu } = useMenuContext()
  const itemRef = React.useRef<HTMLButtonElement>(null)
  const combinedRef = React.useMemo(() => mergeRefs(forwardedRef, itemRef), [forwardedRef])
  const reactId = React.useId()
  const id = React.useMemo(() => `ui-menu-item-${reactId.replace(/:/g, "")}`, [reactId])
    const isDisabled = !!disabled
    const isActive = activeId === id

    React.useEffect(() => {
      registerItem({ id, ref: itemRef, disabled: isDisabled })
      return () => unregisterItem(id)
    }, [id, isDisabled, registerItem, unregisterItem])

    return (
      <button
        {...props}
        id={id}
        ref={combinedRef}
        type="button"
        role="menuitem"
        className={classNames("ui-menu-item", inset && "ui-menu-item-inset", className)}
        data-focused={isActive ? "true" : undefined}
        data-inset={inset ? "true" : undefined}
        data-disabled={isDisabled ? "true" : undefined}
        tabIndex={isActive ? 0 : -1}
        disabled={isDisabled}
        onMouseEnter={(event) => {
          onMouseEnter?.(event)
          if (event.defaultPrevented || isDisabled) return
          focusItem(id)
        }}
        onFocus={(event) => {
          onFocus?.(event)
          if (event.defaultPrevented || isDisabled) return
          focusItem(id)
        }}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented || isDisabled) return
          onSelect?.()
          if (closeOnSelect) {
            closeMenu()
          }
        }}
      >
        {children}
      </button>
    )
  }
)

MenuItem.displayName = "MenuItem"

export const MenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-menu-label", className)} />
  )
)

MenuLabel.displayName = "MenuLabel"

export const MenuGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-menu-group", className)} />
  )
)

MenuGroup.displayName = "MenuGroup"

export const MenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, forwardedRef) => (
    <div {...props} ref={forwardedRef} className={classNames("ui-menu-separator", className)} role="separator" />
  )
)

MenuSeparator.displayName = "MenuSeparator"

export const MenuShortcut = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, forwardedRef) => (
    <span {...props} ref={forwardedRef} className={classNames("ui-menu-shortcut", className)} />
  )
)

MenuShortcut.displayName = "MenuShortcut"

