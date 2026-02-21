import { useState, useCallback, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Wraps a block (e.g. a <pre> JSON block) and shows a small copy button in the
 * top-right corner on hover.
 */
export function CopyableBlock({
  value,
  children,
  className = "",
}: {
  /** The text to copy — defaults to innerText of children if omitted. */
  value?: string;
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text =
      value !== undefined
        ? value
        : typeof children === "string"
          ? children
          : "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value, children]);

  return (
    <div className={`group/copy relative ${className}`}>
      {children}
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded-md bg-white/80 border border-gray-200 shadow-sm opacity-0 group-hover/copy:opacity-100 transition-opacity duration-150 hover:bg-gray-100 cursor-pointer"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-gray-500" />
        )}
      </button>
    </div>
  );
}

/**
 * Wraps inline content (e.g. a table cell value) and shows a tiny copy icon on
 * hover next to the content.
 */
export function CopyableCell({
  value,
  children,
  className = "",
}: {
  /** The text to copy. */
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [value],
  );

  return (
    <span className={`group/cell inline-flex items-start gap-1 ${className}`}>
      <span className="min-w-0">{children}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 p-0.5 rounded opacity-0 group-hover/cell:opacity-100 transition-opacity duration-150 hover:bg-gray-100 cursor-pointer mt-0.5"
        title="Copy"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3 text-gray-400" />
        )}
      </button>
    </span>
  );
}
