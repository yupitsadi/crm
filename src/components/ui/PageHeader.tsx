'use client';

import React from 'react';

interface PageHeaderProps {
  pageName: string;
}

const PageHeader = ({ pageName }: PageHeaderProps) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">{pageName}</h1>
      </div>
    </div>
  );
};

export default PageHeader; 