import { useState, useRef, useEffect } from 'react';

export interface SearchableSelectOption {
  id: string;
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full max-w-lg h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer text-left flex items-center justify-between hover:border-[#cbd5e1] transition-colors"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i
          className={`ri-arrow-down-s-line transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-50 max-w-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-[#e2e8f0] sticky top-0 bg-white">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-100"
            />
          </div>

          {/* Options List */}
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li key={opt.id}>
                  <button
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                      value === opt.value
                        ? 'bg-indigo-100 text-indigo-900 font-medium'
                        : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-6 text-center text-slate-400 text-sm">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
