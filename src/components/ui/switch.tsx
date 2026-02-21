import React, { useState, useMemo, useEffect } from 'react';

// --- Global Type Definitions ---

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

// --- Semantic Color Definitions ---

/**
 * Defines the color palette for semantic presets.
 * track: The color for the background track when ON.
 * knob: The color for the knob when ON (primarily used for text-based switches).
 * offTrack: The color for the background track when OFF (default: #e5e7eb).
 */
const SEMANTIC_COLORS = {
  // Primary is now the default and uses a darker slate color
  primary: { track: '#334155', knob: '#1e293b' }, // Dark Slate (New Default)
  secondary: { track: '#10b981', knob: '#059669' }, // Emerald
  success: { track: '#22c55e', knob: '#16a34a' }, // Green
  warning: { track: '#f59e0b', knob: '#d97706' }, // Amber
  info: { track: '#06b6d4', knob: '#0891b2' }, // Cyan
  danger: { track: '#ef4444', knob: '#dc2626' }, // Red
};

const DEFAULT_OFF_COLOR = '#e5e7eb'; // Gray-200
const DEFAULT_BORDER_COLOR = '#9ca3af'; // Gray-400

// --- TypeScript Interface for Switch Props ---

/**
 * Defines the required types for the base Switch component props, including
 * custom color options and semantic presets.
 */
interface SwitchProps {
  initialState?: boolean;
  onChange?: (newState: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
  id?: string;
  disabled?: boolean;
  knobText?: [string, string];
  size?: Size;
  variant?: Variant;
  // New Color Customization Props
  onColor?: string;
  offColor?: string;
  primary?: boolean;
  secondary?: boolean;
  success?: boolean;
  warning?: boolean;
  info?: boolean;
  danger?: boolean;
}


/** Inject Styles */
const injectStyles = () => {
  if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('jian-ui-switch-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'jian-ui-switch-styles';
      style.innerHTML = `
        /* Global Styles & Variables */

        /** START Switch Component Styles **/

        /* --- SWITCH BASE STYLING (Defaults to 'md' size) --- */
          .jian-ui-switch-container {
            height: 34px; 
            border-radius: 34px;
            padding: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease-in-out, width 0.3s, border-color 0.3s;
            position: relative;
            width: 60px; /* MD SIZE DEFAULT (No Text) */
            border: 1px solid transparent; /* Required for outline variant */
            
            /* NEW: Explicit vertical centering using Flexbox */
            display: flex;
            align-items: center; 
            
            /* Background colors are now applied via inline style for custom/preset colors */
            /* Default OFF state shadow remains, but color is via style prop */
          }

          /* Base Knob */
          .jian-ui-switch-knob {
            height: 26px; /* Default MD height */
            background-color: white;
            border-radius: 50%; /* Default: Circle */
            box-shadow: 0 6px 12px -3px rgba(0, 0, 0, 0.2), 0 3px 6px -2px rgba(0, 0, 0, 0.1);
            transform: translateX(0);
            transition: transform 0.3s ease-in-out, background-color 0.3s, color 0.3s, width 0.3s;
            border: 1px solid #cccccc;
            
            /* Text Styling */
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 600;
            line-height: 1;
            width: 26px; /* MD Size */
            font-size: 0.65rem; 
            /* Color properties are now set via inline style */
          }
          
          /* Base Knob ON position (MD) */
          .jian-ui-switch-container.is-on:not(.has-text) .jian-ui-switch-knob {
            transform: translateX(26px); 
          }
          
          /* --- VARIANT STYLING (Layout only) --- */
          
          /* Ghost & Link (Track is transparent when off, but needs a visible outline/border) */
          .jian-ui-switch-container.variant-ghost,
          .jian-ui-switch-container.variant-link {
            box-shadow: none; /* Keep inner shadow off */
            border: 2px solid transparent; /* Ensure base border for transition */
          }
          /* When OFF, add a subtle border to make the switch visible */
          .jian-ui-switch-container.variant-ghost:not(.is-on),
          .jian-ui-switch-container.variant-link:not(.is-on) {
              border-color: #d1d5db; /* Gray-300 border when off for visibility */
          }
          
          /* Outline (Track is transparent when off, uses border) */
          .jian-ui-switch-container.variant-outline:not(.is-on) {
            box-shadow: none;
            /* Border color is applied via inline style */
          }

          /* --- SIZE OVERRIDES (Container Dimensions, No Text) --- */
          /* XS */
          .jian-ui-switch-container.size-xs { width: 44px; height: 24px; border-radius: 24px; }
          .jian-ui-switch-container.size-xs .jian-ui-switch-knob { width: 16px; height: 16px; font-size: 0.5rem; }
          .jian-ui-switch-container.size-xs.is-on:not(.has-text) .jian-ui-switch-knob { transform: translateX(20px); }
          
          /* SM */
          .jian-ui-switch-container.size-sm { width: 52px; height: 30px; border-radius: 30px; }
          .jian-ui-switch-container.size-sm .jian-ui-switch-knob { width: 22px; height: 22px; font-size: 0.6rem; }
          .jian-ui-switch-container.size-sm.is-on:not(.has-text) .jian-ui-switch-knob { transform: translateX(22px); }

          /* LG */
          .jian-ui-switch-container.size-lg { width: 70px; height: 40px; border-radius: 40px; }
          .jian-ui-switch-container.size-lg .jian-ui-switch-knob { width: 32px; height: 32px; font-size: 0.75rem; }
          .jian-ui-switch-container.size-lg.is-on:not(.has-text) .jian-ui-switch-knob { transform: translateX(30px); }
          
          /* XL */
          .jian-ui-switch-container.size-xl { width: 84px; height: 48px; border-radius: 48px; }
          .jian-ui-switch-container.size-xl .jian-ui-switch-knob { width: 40px; height: 40px; font-size: 0.8rem; }
          .jian-ui-switch-container.size-xl.is-on:not(.has-text) .jian-ui-switch-knob { transform: translateX(36px); }

          /* --- OVERRIDE STYLING (For Switches with Text - used by StatusToggle) --- */
          /* Text switches knob defaults to white when OFF, active color when ON (via inline style) */

          /* Default Text Size (MD) */
          .jian-ui-switch-container.has-text { width: 100px; }
          .jian-ui-switch-container.has-text .jian-ui-switch-knob { width: 50px; border-radius: 13px; }
          .jian-ui-switch-container.has-text.is-on .jian-ui-switch-knob { transform: translateX(42px); }
          
          /* Text Size XS */
          .jian-ui-switch-container.size-xs.has-text { width: 70px; }
          .jian-ui-switch-container.size-xs.has-text .jian-ui-switch-knob { width: 36px; border-radius: 9px; }
          .jian-ui-switch-container.size-xs.has-text.is-on .jian-ui-switch-knob { transform: translateX(26px); }

          /* Text Size SM */
          .jian-ui-switch-container.size-sm.has-text { width: 85px; }
          .jian-ui-switch-container.size-sm.has-text .jian-ui-switch-knob { width: 44px; border-radius: 11px; }
          .jian-ui-switch-container.size-sm.has-text.is-on .jian-ui-switch-knob { transform: translateX(33px); }
          
          /* Text Size LG */
          .jian-ui-switch-container.size-lg.has-text { width: 115px; }
          .jian-ui-switch-container.size-lg.has-text .jian-ui-switch-knob { width: 56px; border-radius: 16px; }
          .jian-ui-switch-container.size-lg.has-text.is-on .jian-ui-switch-knob { transform: translateX(51px); }

          /* Text Size XL */
          .jian-ui-switch-container.size-xl.has-text { width: 135px; }
          .jian-ui-switch-container.size-xl.has-text .jian-ui-switch-knob { width: 66px; border-radius: 20px; }
          .jian-ui-switch-container.size-xl.has-text.is-on .jian-ui-switch-knob { transform: translateX(61px); }

        /** END Switch Component Styles **/
      `;
      document.head.appendChild(style);
    }
  }
}

// --- Reusable Switch Component ---

/**
 * A reusable, fully responsive toggle switch component with size, variant,
 * and comprehensive color customization.
 */
const Switch: React.FC<SwitchProps> = (props) => {
  const {
    initialState = false, 
    onChange, 
    onCheckedChange,
    checked,
    disabled = false,
    knobText, 
    size = 'md', 
    variant = 'default',
    onColor, 
    offColor, 
    primary, 
    secondary, 
    success, 
    warning, 
    info, 
    danger,
    id,
  } = props;

  // Use controlled state if checked prop is provided, otherwise use internal state
  const isControlled = checked !== undefined;
  const [internalState, setInternalState] = useState<boolean>(initialState);
  const isOn = isControlled ? checked : internalState;
  
  const hasText: boolean = !!knobText;

  const currentKnobText: string = hasText && knobText ? (isOn ? knobText[1] : knobText[0]) : '';

  // --- Color Calculation Logic ---
  const colors = useMemo(() => {
    let activeTrackColor = onColor;
    let inactiveTrackColor = offColor || DEFAULT_OFF_COLOR;
    let activeKnobBgColor = 'white'; // Default for no-text switch knob
    let knobTextColor = hasText ? DEFAULT_BORDER_COLOR : 'transparent'; // Gray when off

    const activePresetKey =
      (primary && 'primary') || (secondary && 'secondary') ||
      (success && 'success') || (warning && 'warning') ||
      (info && 'info') || (danger && 'danger') ||
      null;

    // 1. Determine active color based on presets, falling back to onColor
    if (activePresetKey && SEMANTIC_COLORS[activePresetKey]) {
      const preset = SEMANTIC_COLORS[activePresetKey];
      activeTrackColor = preset.track;
      if (hasText) {
        // Text-based switches use the darker preset color for the ON knob
        activeKnobBgColor = preset.knob;
        knobTextColor = 'white'; // Text on colored knob is white
      }
    } else if (onColor) {
      // If custom onColor is provided without a preset, use it.
      activeTrackColor = onColor;
      if (hasText) {
        // For custom colors, use the onColor for the knob
        activeKnobBgColor = onColor;
        knobTextColor = 'white';
      }
    } else {
      // FALLBACK TO DEFAULT (Primary Color) if no color props are passed
      activeTrackColor = SEMANTIC_COLORS.primary.track;
      if (hasText) {
        activeKnobBgColor = SEMANTIC_COLORS.primary.knob;
        knobTextColor = 'white';
      }
    }

    // 2. Apply variant-specific overrides for the track
    let trackStyle: React.CSSProperties = {};
    if (variant === 'ghost' || variant === 'link') {
      inactiveTrackColor = 'transparent';
      trackStyle.boxShadow = 'none'; // Remove inset shadow
    } else if (variant === 'outline') {
      inactiveTrackColor = 'transparent';
      trackStyle.boxShadow = 'none';
      trackStyle.borderColor = DEFAULT_BORDER_COLOR; // Border when off
    }

    // 3. Final styles to apply
    const finalTrackColor = isOn ? activeTrackColor : inactiveTrackColor;
    const finalKnobBgColor = isOn ? activeKnobBgColor : 'white'; // Knob is always white when off

    trackStyle.backgroundColor = finalTrackColor;

    // Handle outline variant border for ON state
    if (variant === 'outline') {
      trackStyle.borderColor = isOn ? activeTrackColor : DEFAULT_BORDER_COLOR;
    }

    // Ensure text switches have white knob text when ON, and fallback gray when OFF
    const finalKnobTextColor = isOn && hasText ? knobTextColor : (hasText ? DEFAULT_BORDER_COLOR : 'transparent');


    return {
      trackStyle,
      knobBg: finalKnobBgColor,
      knobText: finalKnobTextColor,
      activeTrackColor: activeTrackColor // Used by StatusToggle for description color
    };
  }, [isOn, variant, hasText, onColor, offColor, primary, secondary, success, warning, info, danger]);


  // Handler for when the switch is clicked
  const toggleSwitch = (): void => {
    if (disabled) {
      return;
    }
    const newState: boolean = !isOn;
    
    // Update internal state only if uncontrolled
    if (!isControlled) {
      setInternalState(newState);
    }
    
    // Call both callbacks if provided
    if (onChange) {
      onChange(newState);
    }
    if (onCheckedChange) {
      onCheckedChange(newState);
    }
  };

  // Inject styles on component mount
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div
      // Apply size, state, text presence, and variant classes
      className={`jian-ui-switch-container size-${size} ${isOn ? 'is-on' : ''} ${hasText ? 'has-text' : ''} variant-${variant}`}
      onClick={disabled ? undefined : toggleSwitch}
      role="switch"
      aria-checked={isOn}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      id={id}
      style={{
        ...colors.trackStyle,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto',
      }} // Apply dynamic track colors and border
    >
      <div
        className="jian-ui-switch-knob"
        style={{
          
          
        }}
      >
        {currentKnobText}
      </div>
    </div>
  );
};


export { Switch, type SwitchProps };
