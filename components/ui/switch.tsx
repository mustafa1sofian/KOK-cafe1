'use client';

import * as React from 'react';

interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ id, checked, onCheckedChange, className = '' }, ref) => {
    return (
      <label className="relative inline-block w-14 h-8 cursor-pointer">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="opacity-0 w-0 h-0 peer"
        />
        <span
          className={`
            absolute inset-0 rounded-full border transition-all duration-300
            peer-checked:bg-blue-600 peer-checked:border-blue-600
            peer-focus:ring-2 peer-focus:ring-blue-300
            bg-gray-200 border-gray-300
            before:content-[''] before:absolute before:top-1 before:right-1 
            before:w-6 before:h-6 before:rounded-full before:bg-white before:shadow-sm
            before:transition-transform before:duration-300
            peer-checked:before:-translate-x-6
            ${className}
          `}
        />
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
