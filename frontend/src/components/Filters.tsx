import React from 'react';
import { useMailStore } from '../hooks/useMailStore';

const Filters: React.FC = () => {
  const { filters, setFilters, clearFilters } = useMailStore();

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters({ [key]: value });
  };

  const hasActiveFilters = filters.date_from || filters.date_to || filters.sender || filters.keyword || filters.unread_only;

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="date_from" className="block text-xs font-medium text-gray-600 mb-1">
            From Date
          </label>
          <input
            id="date_from"
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label htmlFor="date_to" className="block text-xs font-medium text-gray-600 mb-1">
            To Date
          </label>
          <input
            id="date_to"
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="sender" className="block text-xs font-medium text-gray-600 mb-1">
            Sender
          </label>
          <input
            id="sender"
            type="email"
            value={filters.sender || ''}
            onChange={(e) => handleFilterChange('sender', e.target.value || undefined)}
            placeholder="sender@example.com"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="keyword" className="block text-xs font-medium text-gray-600 mb-1">
            Keyword
          </label>
          <input
            id="keyword"
            type="text"
            value={filters.keyword || ''}
            onChange={(e) => handleFilterChange('keyword', e.target.value || undefined)}
            placeholder="Search keyword"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.unread_only || false}
              onChange={(e) => handleFilterChange('unread_only', e.target.checked || undefined)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            Unread only
          </label>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default Filters;
