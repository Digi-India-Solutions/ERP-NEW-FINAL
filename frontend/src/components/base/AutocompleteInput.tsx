import {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useDebounce } from '@/utils/debounce';

/**
 * GLOBAL RULE 4 — REUSABLE AUTOCOMPLETE INPUT
 *
 * Dropdown is rendered via React Portal into document.body so it is NEVER
 * clipped by any parent overflow/table stacking context.
 */
export interface AutocompleteInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  fetchOptions: (query: string) => Promise<T[]>;
  placeholder?: string;
  renderOption: (item: T, isHighlighted: boolean) => ReactNode;
  getOptionKey: (item: T) => string;
  getOptionLabel?: (item: T) => string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  minChars?: number;
  /** Pass-through for useKeyboardNav integration */
  'data-nav-index'?: number;
  id?: string;
  autoFocus?: boolean;
  /** Extra keydown handler called after internal handling */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Expose the internal input ref */
  inputRef?: (el: HTMLInputElement | null) => void;
  /** Called when dropdown open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

export default function AutocompleteInput<T>({
  value,
  onChange,
  onSelect,
  fetchOptions,
  placeholder,
  renderOption,
  getOptionKey,
  getOptionLabel,
  disabled = false,
  className = '',
  inputClassName = '',
  minChars = 2,
  'data-nav-index': navIndex,
  id,
  autoFocus,
  onKeyDown: externalKeyDown,
  inputRef: externalInputRef,
  onOpenChange,
}: AutocompleteInputProps<T>) {
  const [options, setOptions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalIdRef = useRef(`ac-portal-${Math.random().toString(36).slice(2)}`);
  const isFocusedRef = useRef(false);
  const userTypingRef = useRef(false);
  const justSelectedRef = useRef(false);
  const debouncedValue = useDebounce(value, 220);

  // ── Calculate dropdown position from input bounding rect ──────────────────
  const updateDropdownPos = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  // Notify parent when open state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Recalculate position whenever dropdown opens or window scrolls/resizes
  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPos();
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [isOpen, updateDropdownPos]);

  // Fetch options when debounced value changes
  useEffect(() => {
    // Ignore hydrated/programmatic value changes unless user is actively interacting.
    if (!isFocusedRef.current && !userTypingRef.current) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    // Selecting an option updates value programmatically; skip one fetch cycle
    // so the dropdown stays closed after selection.
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      setOptions([]);
      setIsOpen(false);
      return;
    }

    if (debouncedValue.length < minChars) {
      setOptions([]);
      setIsOpen(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchOptions(debouncedValue)
      .then((results) => {
        if (!cancelled) {
          setOptions(results);
          if (results.length > 0) {
            updateDropdownPos();
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
          setHighlighted(-1);
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
          userTypingRef.current = false;
        }
      });
    return () => { cancelled = true; };
  }, [debouncedValue, minChars, fetchOptions, updateDropdownPos]);

  // Close on outside click — check both container and portal dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check if click is inside the input container
      if (containerRef.current?.contains(target)) return;
      // Check if click is inside this instance's portal dropdown
      const portalDropdown = document.getElementById(portalIdRef.current);
      if (portalDropdown?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectItem = useCallback(
    (item: T) => {
      justSelectedRef.current = true;
      userTypingRef.current = false;
      const label = getOptionLabel ? getOptionLabel(item) : '';
      if (label) onChange(label);
      onSelect(item);
      setIsOpen(false);
      setOptions([]);
      setHighlighted(-1);
    },
    [onSelect, onChange, getOptionLabel],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, options.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, -1));
        return;
      }
      if (e.key === 'Enter') {
        if (highlighted >= 0 && options[highlighted]) {
          e.preventDefault();
          e.stopPropagation();
          selectItem(options[highlighted]);
          return;
        }
        setIsOpen(false);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        return;
      }
    }
    // Call external handler for barcode detection / arrow nav etc.
    externalKeyDown?.(e);
  };

  // ── Portal dropdown ────────────────────────────────────────────────────────
  const dropdownPortal = isOpen && options.length > 0
    ? createPortal(
        <div
          id={portalIdRef.current}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {options.map((item, idx) => (
            <div
              key={getOptionKey(item)}
              onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
              onMouseEnter={() => setHighlighted(idx)}
              className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
                idx === highlighted
                  ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
                  : 'hover:bg-[#f8fafc] text-[#1e293b]'
              }`}
            >
              {renderOption(item, idx === highlighted)}
            </div>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={(el) => {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          externalInputRef?.(el);
        }}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={() => { userTypingRef.current = true; }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          isFocusedRef.current = true;
          if (options.length > 0) {
            updateDropdownPos();
            setIsOpen(true);
          }
        }}
        onBlur={() => {
          isFocusedRef.current = false;
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        data-nav-index={navIndex}
        className={
          inputClassName ||
          `w-full h-10 px-3 pr-8 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`
        }
      />
      {/* Loading / chevron indicator */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        {isLoading ? (
          <i className="ri-loader-4-line text-[#94a3b8] text-sm animate-spin" />
        ) : (
          <i
            className={`ri-arrow-down-s-line text-[#94a3b8] text-sm transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </div>

      {/* Dropdown rendered via portal — never clipped by table/overflow parents */}
      {dropdownPortal}
    </div>
  );
}
