import * as React from "react"

// CSS styles injected into document head
const injectButtonStyles = () => {
  const existingStyle = document.getElementById('ui-button-styles');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'ui-button-styles';
    style.textContent = `
      .ui-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;
        outline: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        text-decoration: none;
        box-sizing: border-box;
      }

      .ui-button:disabled {
        pointer-events: none;
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Variants */
      .ui-button-default {
        background-color: #111827;
        color: #ffffff;
      }
      .ui-button-default:hover:not(:disabled),
      .ui-button-default:active:not(:disabled) {
        background-color: #1f2937;
      }

      .ui-button-destructive {
        background-color: #ef4444;
        color: #ffffff;
      }
      .ui-button-destructive:hover:not(:disabled),
      .ui-button-destructive:active:not(:disabled) {
        background-color: #dc2626;
      }

      .ui-button-outline {
        background-color: #ffffff;
        color: #374151;
        border: 1px solid #d1d5db;
      }
      .ui-button-outline:hover:not(:disabled),
      .ui-button-outline:active:not(:disabled) {
        background-color: #f9fafb;
      }

      .ui-button-secondary {
        background-color: #f3f4f6;
        color: #111827;
      }
      .ui-button-secondary:hover:not(:disabled),
      .ui-button-secondary:active:not(:disabled) {
        background-color: #e5e7eb;
      }

      .ui-button-ghost {
        background-color: transparent;
        color: #374151;
      }
      .ui-button-ghost:hover:not(:disabled),
      .ui-button-ghost:active:not(:disabled) {
        background-color: #f3f4f6;
      }

      .ui-button-link {
        background-color: transparent;
        color: #111827;
        text-decoration: underline;
        text-underline-offset: 4px;
      }
      .ui-button-link:hover:not(:disabled),
      .ui-button-link:active:not(:disabled) {
        text-decoration: underline;
      }

      /* Sizes */
      .ui-button-default-size {
        height: 40px;
        padding: 8px 16px;
        font-size: 14px;
      }

      .ui-button-sm {
        height: 32px;
        padding: 4px 12px;
        font-size: 14px;
      }

      .ui-button-lg {
        height: 48px;
        padding: 12px 24px;
        font-size: 16px;
      }

      .ui-button-xl {
        height: 56px;
        padding: 16px 32px;
        font-size: 18px;
      }

      .ui-button-icon {
        height: 40px;
        width: 40px;
        padding: 0;
      }

      .ui-button-auto {
        height: auto;
        padding: 8px 16px;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }
};

// Get button CSS classes
const getButtonClasses = (variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size: 'default' | 'sm' | 'lg' | 'icon' | 'xl' | 'auto') => {
  const baseClass = 'ui-button';
  const variantClass = `ui-button-${variant}`;
  const sizeClass = size === 'default' ? 'ui-button-default-size' : `ui-button-${size}`;
  
  return `${baseClass} ${variantClass} ${sizeClass}`;
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl' | 'auto'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild, ...props }, ref) => {
    // Inject styles on first render
    React.useEffect(() => {
      injectButtonStyles();
    }, []);

    const buttonClasses = getButtonClasses(variant, size);
    const finalClasses = className ? `${buttonClasses} ${className}` : buttonClasses;
    
    if (asChild) {
      const child = props.children as React.ReactElement;
      return React.cloneElement(child, {
        className: finalClasses,
        ref: ref,
        ...props,
        children: child.props.children,
      });
    }
    
    return (
      <button
        className={finalClasses}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
