import React from 'react';

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 ${className || 'h-6 w-6'}`}
      {...props}
    />
  );
} 