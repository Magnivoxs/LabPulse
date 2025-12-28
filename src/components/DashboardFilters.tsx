import { OfficeSummary, DashboardFilters as FilterType, SortOption, extractState } from '../types/Dashboard';

interface DashboardFiltersProps {
  offices: OfficeSummary[];
  filters: FilterType;
  sortBy: SortOption;
  onFiltersChange: (filters: FilterType) => void;
  onSortChange: (sort: SortOption) => void;
}

export default function DashboardFilters({
  offices,
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
}: DashboardFiltersProps) {
  // Extract unique states from offices
  const states = Array.from(new Set(offices.map(o => extractState(o.office_name)))).sort();
  
  // Extract unique DFOs from offices
  const dfos = Array.from(
    new Set(offices.map(o => o.dfo).filter(Boolean))
  ).sort() as string[];
  
  // Extract unique models
  const models = Array.from(new Set(offices.map(o => o.model))).sort();

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, state: e.target.value || undefined });
  };

  const handleDfoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, dfo: e.target.value || undefined });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, model: e.target.value || undefined });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchTerm: e.target.value || undefined });
  };

  const handleDataStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as FilterType['dataStatus'];
    onFiltersChange({ ...filters, dataStatus: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      state: undefined,
      dfo: undefined,
      model: undefined,
      searchTerm: undefined,
      dataStatus: 'all',
    });
  };

  const hasActiveFilters = 
    filters.state || 
    filters.dfo || 
    filters.model || 
    filters.searchTerm || 
    (filters.dataStatus && filters.dataStatus !== 'all');

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Top Row: Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={handleSearchChange}
              placeholder="Search by office name or ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort By */}
          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="office_id_asc">Office ID</option>
              <option value="name_asc">Office Name (A-Z)</option>
              <option value="revenue_desc">Revenue (High to Low)</option>
              <option value="lab_exp_desc">Lab Exp % (High to Low)</option>
              <option value="latest_first">Latest Data First</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              value={filters.state || ''}
              onChange={handleStateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* DFO Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DFO
            </label>
            <select
              value={filters.dfo || ''}
              onChange={handleDfoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All DFOs</option>
              {dfos.map(dfo => (
                <option key={dfo} value={dfo}>{dfo}</option>
              ))}
            </select>
          </div>

          {/* Model Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={filters.model || ''}
              onChange={handleModelChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Models</option>
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* Data Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Status
            </label>
            <select
              value={filters.dataStatus || 'all'}
              onChange={handleDataStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="complete">Complete</option>
              <option value="partial">Partial</option>
              <option value="none">No Data</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

