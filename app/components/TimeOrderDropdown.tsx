'use client'

import { useState, useRef, useEffect } from 'react';

interface TimeOrderDropdownProps {
  timeOrder: 'asc' | 'desc';
  onTimeOrderChange: (order: 'asc' | 'desc') => void;
}

export default function TimeOrderDropdown({ timeOrder, onTimeOrderChange }: TimeOrderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { id: 'asc' as const, label: 'Earliest First', icon: '⬆️' },
    { id: 'desc' as const, label: 'Latest First', icon: '⬇️' },
  ];

  const currentOption = options.find(opt => opt.id === timeOrder) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionId: 'asc' | 'desc') => {
    onTimeOrderChange(optionId);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center " ref={dropdownRef}>
      
      
      <div className="relative">
        {/* Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-1  bg-zoro-card border border-zoro-border rounded-lg text-zoro-white hover:border-zoro-yellow/50 transition-all min-w-[100px]"
        >
         
          <span className="text-xs font-semibold flex-1 text-left">
            {currentOption.label}
          </span>
          <svg
            className={`w-3 h-3 text-zoro-grey transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-zoro-card border border-zoro-border rounded-lg shadow-lg overflow-hidden z-50">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-left transition-colors
                  ${timeOrder === option.id
                    ? 'bg-zoro-yellow text-zoro-dark font-bold'
                    : 'text-zoro-grey hover:bg-zoro-border hover:text-zoro-white'
                  }
                `}
              >
                
                <span className="text-xs font-semibold">{option.label}</span>
                {timeOrder === option.id && (
                  <svg
                    className="w-4 h-4 ml-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}