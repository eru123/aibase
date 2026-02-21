import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

// Type definitions
interface ThemeColors {
  primary: string;
  surface: string;
  text: string;
  textMuted: string;
  textLight: string;
}

interface BorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

interface ThemeConfig {
  colors: ThemeColors;
  borderRadius: BorderRadius;
}

interface GeneratedColors {
  surface: {
    subtle: string;
    whisper: string;
    soft: string;
    gentle: string;
  };
  border: {
    faint: string;
    subtle: string;
    soft: string;
    defined: string;
  };
  text: {
    whisper: string;
    muted: string;
    subtle: string;
    emphasis: string;
    strong: string;
  };
}

interface ComponentStyles {
  card: {
    elevated: React.CSSProperties;
  };
}

interface ModalContextType {
  themeConfig: ThemeConfig;
}

interface ModalProviderProps {
  children: ReactNode;
  themeConfig?: ThemeConfig;
}

interface ModalProps {
  maxWidth?: string;
  onClose: () => void;
  children: ReactNode;
  show: boolean;
  disableDefaultClose?: boolean;
  themeConfig?: ThemeConfig;
  closeOnOverlayClick?: boolean;
  xs?: boolean;
  sm?: boolean;
  md?: boolean;
  lg?: boolean;
  xl?: boolean;
  padding?: string;
  noPadding?: boolean;
  showCloseButton?: boolean;
}

// Independent Modal Theme Configuration
const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {
    primary: "#0ea5e9",
    surface: "#ffffff",
    text: "#1f2937",
    textMuted: "#6b7280",
    textLight: "#9ca3af",
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
};

// Theme utilities for the independent modal
const createThemeColors = (
  themeConfig: ThemeConfig,
): Partial<GeneratedColors> => {
  if (!themeConfig?.colors?.primary) return {};

  const baseColor = themeConfig.colors.primary;

  // Extract RGB values from hex
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return {
    // Ultra-subtle backgrounds
    surface: {
      subtle: `rgba(${r}, ${g}, ${b}, 0.02)`,
      whisper: `rgba(${r}, ${g}, ${b}, 0.05)`,
      soft: `rgba(${r}, ${g}, ${b}, 0.08)`,
      gentle: `rgba(${r}, ${g}, ${b}, 0.12)`,
    },

    // Refined borders
    border: {
      faint: `rgba(${r}, ${g}, ${b}, 0.15)`,
      subtle: `rgba(${r}, ${g}, ${b}, 0.25)`,
      soft: `rgba(${r}, ${g}, ${b}, 0.35)`,
      defined: `rgba(${r}, ${g}, ${b}, 0.45)`,
    },

    // Sophisticated text colors
    text: {
      whisper: `rgba(${r}, ${g}, ${b}, 0.40)`,
      muted: `rgba(${r}, ${g}, ${b}, 0.60)`,
      subtle: `rgba(${r}, ${g}, ${b}, 0.75)`,
      emphasis: `rgba(${r}, ${g}, ${b}, 0.85)`,
      strong: `rgba(${r}, ${g}, ${b}, 0.95)`,
    },
  };
};

const shadows = {
  whisper: "0 1px 2px 0 rgba(0, 0, 0, 0.02)",
  soft: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
  gentle:
    "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
  subtle:
    "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
  elegant:
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

const createComponentStyles = (themeConfig: ThemeConfig): ComponentStyles => {
  const colors = createThemeColors(themeConfig);

  return {
    card: {
      elevated: {
        backgroundColor: themeConfig?.colors?.surface || "#ffffff",
        border: `1px solid ${colors.border?.faint || "rgba(0,0,0,0.1)"}`,
        borderRadius: themeConfig?.borderRadius?.lg || "0.75rem",
        boxShadow: shadows.gentle,
      },
    },
  };
};

// Independent Modal Context
const ModalContext = createContext<ModalContextType | undefined>(undefined);

const ModalProvider: React.FC<ModalProviderProps> = ({
  children,
  themeConfig = DEFAULT_THEME_CONFIG,
}) => {
  const value: ModalContextType = {
    themeConfig,
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    // If no context is provided, use default theme
    return { themeConfig: DEFAULT_THEME_CONFIG };
  }
  return context;
};

// CSS styles as a string to be injected
const modalStyles = `
  .independent-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    margin: 0 !important;
  }

  .independent-modal-content {
    position: relative;
    height: fit-content;
    margin: auto;
    max-width: 640px;
    width: 100%;
    min-width: 384px;
    padding: 32px 40px;
    transform: scale(0.95) translateY(8px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .independent-modal-content.size-xs {
    max-width: 320px;
    width: 320px;
    min-width: 280px;
  }

  .independent-modal-content.size-sm {
    max-width: 448px;
    width: 448px;
    min-width: 320px;
  }

  .independent-modal-content.size-md {
    max-width: 640px;
    width: 640px;
    min-width: 384px;
  }

  .independent-modal-content.size-lg {
    max-width: 896px;
    width: 896px;
    min-width: 512px;
  }

  .independent-modal-content.size-xl {
    max-width: 1152px;
    width: 1152px;
    min-width: 640px;
  }

  .independent-modal-content.animated {
    transform: scale(1) translateY(0);
    opacity: 1;
  }

  .independent-modal-content.shake {
    animation: modal-shake 0.5s ease-in-out;
  }

  @keyframes modal-shake {
    0%, 100% { transform: scale(1) translateY(0) translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: scale(1) translateY(0) translateX(-8px); }
    20%, 40%, 60%, 80% { transform: scale(1) translateY(0) translateX(8px); }
  }

  .independent-modal-close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1.25rem;
    line-height: 1;
    border-radius: 0.5rem;
  }

  .independent-modal-close-button:hover {
    transform: scale(1.05);
  }

  .independent-modal-close-button svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }

  /* Custom scrollbar for modal */
  .independent-modal-overlay::-webkit-scrollbar {
    width: 8px;
  }

  .independent-modal-overlay::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  .independent-modal-overlay::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .independent-modal-overlay::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }

  /* Firefox scrollbar */
  .independent-modal-overlay {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1);
  }

  /* Body overflow hidden when modal is open */
  body.modal-open {
    overflow: hidden;
  }

  /* Media queries for responsive design */
  @media (max-width: 640px) {
    .independent-modal-overlay {
      align-items: flex-start;
      padding: 16px 8px;
    }
    
    .independent-modal-content,
    .independent-modal-content.size-xs,
    .independent-modal-content.size-sm,
    .independent-modal-content.size-md,
    .independent-modal-content.size-lg,
    .independent-modal-content.size-xl {
      min-width: auto;
      width: 100%;
      max-width: calc(100vw - 16px);
      padding: 24px 16px;
    }
  }
`;

// Inject styles into the document head
const injectStyles = () => {
  const existingStyle = document.getElementById("independent-modal-styles");
  if (!existingStyle) {
    const style = document.createElement("style");
    style.id = "independent-modal-styles";
    style.textContent = modalStyles;
    document.head.appendChild(style);
  }
};

const Modal: React.FC<ModalProps> = ({
  onClose,
  children,
  show,
  disableDefaultClose = false,
  themeConfig,
  closeOnOverlayClick = true,
  xs,
  sm,
  md,
  lg,
  xl,
  padding,
  noPadding = false,
  showCloseButton = true,
  maxWidth,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [animating, setAnimating] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contextTheme = useModalContext();

  // Use provided themeConfig or context theme or default
  const activeTheme =
    themeConfig || contextTheme.themeConfig || DEFAULT_THEME_CONFIG;
  const colors = createThemeColors(activeTheme);
  const styles = createComponentStyles(activeTheme);

  // Determine size class
  const getSizeClass = () => {
    if (xs) return "size-xs";
    if (sm) return "size-sm";
    if (md) return "size-md";
    if (lg) return "size-lg";
    if (xl) return "size-xl";
    return "size-md"; // default to medium
  };

  const sizeClass = getSizeClass();

  // Determine padding
  const getPadding = () => {
    if (noPadding) return "0";
    if (padding) return padding;

    // Default padding based on size
    if (xs) return "24px 32px";
    if (sm) return "24px 32px";
    if (lg) return "32px 40px";
    if (xl) return "40px 48px";
    return "32px 40px"; // default for md
  };

  const modalPadding = getPadding();

  // Debug: log the size class being applied
  // useEffect(() => {
  //   console.log('Modal size class:', sizeClass, { xs, sm, md, lg, xl });
  // }, [sizeClass, xs, sm, md, lg, xl]);

  // Inject styles on component mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Effect to handle modal visibility and animation states
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setAnimating(true);
        document.body.classList.add("modal-open");
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setAnimating(false);
      document.body.classList.remove("modal-open");
    }
  }, [show]);

  // Handle clicks on the overlay to close the modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !disableDefaultClose) {
      if (closeOnOverlayClick) {
        onClose();
      } else {
        // Trigger shake animation to indicate modal cannot be dismissed
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  // Handle transition end for the modal content
  const handleTransitionEnd = () => {
    if (!show) {
      setIsVisible(false);
    }
  };

  // Clean up body overflow when the component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  if (!isVisible && !animating) {
    return null;
  }

  const overlayStyle = {
    opacity: animating ? 1 : 0,
  };

  const modalStyle = {
    ...styles.card.elevated,
    backgroundColor: activeTheme?.colors?.surface,
    borderRadius: activeTheme?.borderRadius?.xl || "1rem",
    boxShadow: shadows.elegant,
    border: `1px solid ${colors.border?.faint || "rgba(0,0,0,0.05)"}`,
    padding: modalPadding,
    maxWidth: maxWidth,
  };

  const closeButtonStyle = {
    color: activeTheme?.colors?.textMuted || "#6b7280",
  };

  const closeButtonHoverStyle = {
    backgroundColor: colors.surface?.soft || "rgba(0,0,0,0.05)",
    color: activeTheme?.colors?.text || "#1f2937",
  };

  return (
    <div
      className="independent-modal-overlay"
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`independent-modal-content ${sizeClass} ${animating ? "animated" : ""} ${isShaking ? "shake" : ""}`}
        style={modalStyle}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Close button */}
        {!disableDefaultClose && showCloseButton && (
          <button
            onClick={onClose}
            className="independent-modal-close-button"
            style={closeButtonStyle}
            onMouseEnter={(e) =>
              Object.assign(
                (e.target as HTMLElement).style,
                closeButtonHoverStyle,
              )
            }
            onMouseLeave={(e) =>
              Object.assign((e.target as HTMLElement).style, closeButtonStyle)
            }
            aria-label="Close modal"
          >
            <svg viewBox="0 0 16 16">
              <path d="M12 4L4 12M4 4l8 8" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

// Confirmation Modal Function
interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "success" | "warning" | "danger" | "error" | "info";
  xs?: boolean;
  sm?: boolean;
  md?: boolean;
  lg?: boolean;
  xl?: boolean;
}

const confirmModal = (options: ConfirmModalOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const {
      title,
      message,
      confirmText = "Yes",
      cancelText = "No",
      type,
      xs,
      sm = true,
      md,
      lg,
      xl,
    } = options;

    // Define color themes and icons based on type
    const getThemeConfig = (type?: string) => {
      switch (type) {
        case "success":
          return {
            confirmButtonColor: "#10b981", // green
            confirmButtonHoverColor: "#059669",
            iconColor: "#10b981",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ),
          };
        case "warning":
          return {
            confirmButtonColor: "#f59e0b", // amber
            confirmButtonHoverColor: "#d97706",
            iconColor: "#f59e0b",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          };
        case "danger":
        case "error":
          return {
            confirmButtonColor: "#ef4444", // red
            confirmButtonHoverColor: "#dc2626",
            iconColor: "#ef4444",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M15 9l-6 6m0-6l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          };
        case "info":
          return {
            confirmButtonColor: "#3b82f6", // blue
            confirmButtonHoverColor: "#2563eb",
            iconColor: "#3b82f6",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4m0 4h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          };
        default:
          return {
            confirmButtonColor: "#111827", // default dark
            confirmButtonHoverColor: "#1f2937",
            iconColor: null,
            icon: null,
          };
      }
    };

    const themeConfig = getThemeConfig(type);

    // Ensure modal styles are available for standalone usage
    injectStyles();

    // Create modal container
    const modalContainer = document.createElement("div");
    document.body.appendChild(modalContainer);

    // Cleanup function
    const cleanup = () => {
      document.body.removeChild(modalContainer);
    };

    // Handle confirm with animation
    const handleConfirm = () => {
      // Don't cleanup immediately, let animation finish first
      resolve(true);
    };

    // Handle cancel with animation
    const handleCancel = () => {
      // Don't cleanup immediately, let animation finish first
      resolve(false);
    };

    // Create the confirmation modal component
    const ConfirmModalComponent = () => {
      const [show, setShow] = useState(false);
      const [animating, setAnimating] = useState(false);
      const [isClosing, setIsClosing] = useState(false);
      const [isPending, setIsPending] = useState(false);
      const modalRef = useRef<HTMLDivElement>(null);
      const cancelButtonRef = useRef<HTMLButtonElement>(null);
      const confirmButtonRef = useRef<HTMLButtonElement>(null);

      useEffect(() => {
        // Show modal after a brief delay to ensure DOM is ready
        const timer = setTimeout(() => {
          setShow(true);
          setAnimating(true);
          document.body.classList.add("modal-open");
        }, 10);
        return () => clearTimeout(timer);
      }, []);

      useEffect(() => {
        if (!show || isPending) return;

        const focusTarget = confirmButtonRef.current ?? cancelButtonRef.current;
        focusTarget?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
          if (isPending) return;

          if (event.key === "Escape") {
            event.preventDefault();
            handleCancelClick();
            return;
          }

          if (event.key !== "Tab") return;

          const focusables = [
            cancelButtonRef.current,
            confirmButtonRef.current,
          ].filter((el): el is HTMLButtonElement => Boolean(el));
          if (focusables.length === 0) return;

          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement as HTMLElement | null;

          if (!active || !focusables.includes(active as HTMLButtonElement)) {
            event.preventDefault();
            first.focus();
            return;
          }

          if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
          document.removeEventListener("keydown", handleKeyDown);
        };
      }, [show, isPending]);

      // Handle confirm with closing animation
      const handleConfirmClick = () => {
        if (isPending) return;
        setIsPending(true);
        setIsClosing(true);
        setAnimating(false);
        document.body.classList.remove("modal-open");
        setTimeout(() => {
          cleanup();
          resolve(true);
        }, 300); // Match the CSS transition duration
      };

      // Handle cancel with closing animation
      const handleCancelClick = () => {
        if (isPending) return;
        setIsPending(true);
        setIsClosing(true);
        setAnimating(false);
        document.body.classList.remove("modal-open");
        setTimeout(() => {
          cleanup();
          resolve(false);
        }, 300); // Match the CSS transition duration
      };

      // Handle overlay click to trigger shake
      const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && modalRef.current) {
          // Manually trigger shake animation
          modalRef.current.classList.add("shake");
          setTimeout(() => {
            if (modalRef.current) {
              modalRef.current.classList.remove("shake");
            }
          }, 500);
        }
      };

      // Don't render if not visible and not animating
      if (!show && !animating && !isClosing) {
        return null;
      }

      const overlayStyle = {
        opacity: animating ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
      };

      const contentStyle = {
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        border: "1px solid rgba(0,0,0,0.05)",
        padding: "0",
        transform: animating
          ? "scale(1) translateY(0)"
          : "scale(0.95) translateY(8px)",
        opacity: animating ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
      };

      return (
        <div
          className="independent-modal-overlay"
          style={overlayStyle}
          onClick={handleOverlayClick}
        >
          <div
            ref={modalRef}
            className="independent-modal-content size-sm"
            style={contentStyle}
          >
            <div>
              {/* Header */}
              <div
                style={{
                  padding: "1rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 8px 0",
                      lineHeight: "1.5",
                      display: "flex",
                      alignItems: "center",
                      gap: ".25rem",
                    }}
                  >
                    {themeConfig.icon && (
                      <div
                        style={{
                          color: themeConfig.iconColor,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        {themeConfig.icon}
                      </div>
                    )}
                    <span>{title}</span>
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: "1.5",
                    }}
                  >
                    {message}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "12px",
                  padding: "0 1rem 1rem 0",
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelClick}
                  ref={cancelButtonRef}
                  disabled={isPending}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: isPending ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: isPending ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (isPending) return;
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (isPending) return;
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClick}
                  ref={confirmButtonRef}
                  disabled={isPending}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#ffffff",
                    backgroundColor: themeConfig.confirmButtonColor,
                    border: "1px solid transparent",
                    borderRadius: "6px",
                    cursor: isPending ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: isPending ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (isPending) return;
                    e.currentTarget.style.backgroundColor =
                      themeConfig.confirmButtonHoverColor;
                  }}
                  onMouseLeave={(e) => {
                    if (isPending) return;
                    e.currentTarget.style.backgroundColor =
                      themeConfig.confirmButtonColor;
                  }}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Render the modal
    const root = createRoot(modalContainer);
    root.render(<ConfirmModalComponent />);
  });
};

// Alert Modal Function
interface AlertModalOptions {
  title: string;
  message: string;
  buttonText?: string;
  type?: "success" | "warning" | "danger" | "error" | "info";
  xs?: boolean;
  sm?: boolean;
  md?: boolean;
  lg?: boolean;
  xl?: boolean;
}

const alertModal = (options: AlertModalOptions): Promise<void> => {
  return new Promise((resolve) => {
    const {
      title,
      message,
      buttonText = "OK",
      type,
      xs,
      sm = true,
      md,
      lg,
      xl,
    } = options;

    // Define color themes and icons based on type (same as confirmModal)
    const getThemeConfig = (type?: string) => {
      switch (type) {
        case "success":
          return {
            confirmButtonColor: "#10b981", // green
            confirmButtonHoverColor: "#059669",
            iconColor: "#10b981",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ),
          };
        case "warning":
          return {
            confirmButtonColor: "#f59e0b", // amber
            confirmButtonHoverColor: "#d97706",
            iconColor: "#f59e0b",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          };
        case "danger":
        case "error":
          return {
            confirmButtonColor: "#ef4444", // red
            confirmButtonHoverColor: "#dc2626",
            iconColor: "#ef4444",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M15 9l-6 6m0-6l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          };
        case "info":
          return {
            confirmButtonColor: "#3b82f6", // blue
            confirmButtonHoverColor: "#2563eb",
            iconColor: "#3b82f6",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4m0 4h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          };
        default:
          return {
            confirmButtonColor: "#111827", // default dark
            confirmButtonHoverColor: "#1f2937",
            iconColor: null,
            icon: null,
          };
      }
    };

    const themeConfig = getThemeConfig(type);

    // Ensure modal styles are available for standalone usage
    injectStyles();

    // Create modal container
    const modalContainer = document.createElement("div");
    document.body.appendChild(modalContainer);

    // Cleanup function
    const cleanup = () => {
      document.body.removeChild(modalContainer);
    };

    // Create the alert modal component
    const AlertModalComponent = () => {
      const [show, setShow] = useState(false);
      const [animating, setAnimating] = useState(false);
      const [isClosing, setIsClosing] = useState(false);
      const modalRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        // Show modal after a brief delay to ensure DOM is ready
        const timer = setTimeout(() => {
          setShow(true);
          setAnimating(true);
          document.body.classList.add("modal-open");
        }, 10);
        return () => clearTimeout(timer);
      }, []);

      // Handle close with closing animation
      const handleClose = () => {
        setIsClosing(true);
        setAnimating(false);
        document.body.classList.remove("modal-open");
        setTimeout(() => {
          cleanup();
          resolve();
        }, 300); // Match the CSS transition duration
      };

      // Handle overlay click to close (unlike confirmModal, this closes the modal)
      const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      };

      // Don't render if not visible and not animating
      if (!show && !animating && !isClosing) {
        return null;
      }

      const overlayStyle = {
        opacity: animating ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
      };

      const contentStyle = {
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        border: "1px solid rgba(0,0,0,0.05)",
        padding: "0",
        transform: animating
          ? "scale(1) translateY(0)"
          : "scale(0.95) translateY(8px)",
        opacity: animating ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
      };

      return (
        <div
          className="independent-modal-overlay"
          style={overlayStyle}
          onClick={handleOverlayClick}
        >
          <div
            ref={modalRef}
            className="independent-modal-content size-sm"
            style={contentStyle}
          >
            <div>
              {/* Header */}
              <div
                style={{
                  padding: "1rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 8px 0",
                      lineHeight: "1.5",
                      display: "flex",
                      alignItems: "center",
                      gap: ".25rem",
                    }}
                  >
                    {themeConfig.icon && (
                      <div
                        style={{
                          color: themeConfig.iconColor,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        {themeConfig.icon}
                      </div>
                    )}
                    <span>{title}</span>
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: "1.5",
                    }}
                  >
                    {message}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "12px",
                  padding: "0 1rem 1rem 0",
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#ffffff",
                    backgroundColor: themeConfig.confirmButtonColor,
                    border: "1px solid transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      themeConfig.confirmButtonHoverColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      themeConfig.confirmButtonColor;
                  }}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Render the modal
    const root = createRoot(modalContainer);
    root.render(<AlertModalComponent />);
  });
};

// Export both the Modal component and the Provider for flexibility
export { Modal, ModalProvider, useModalContext, confirmModal, alertModal };
export default Modal;
