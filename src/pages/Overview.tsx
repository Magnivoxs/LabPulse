import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLocation } from 'react-router-dom';
import DashboardSummary from '../components/DashboardSummary';
import DashboardFilters from '../components/DashboardFilters';
import OfficeCard from '../components/OfficeCard';
import { 
  OfficeSummary, 
  DashboardFilters as FilterType, 
  SortOption,
  getDataStatus,
  extractState 
} from '../types/Dashboard';

export default function Overview() {
  const location = useLocation();
  
  // Current month/year (default to current date)
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  
  // Data state
  const [allOffices, setAllOffices] = useState<OfficeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and sort state
  const [filters, setFilters] = useState<FilterType>({
    state: undefined,
    dfo: undefined,
    model: undefined,
    searchTerm: undefined,
    dataStatus: 'all',
  });
  const [sortBy, setSortBy] = useState<SortOption>('office_id_asc');
  
  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, [currentMonth, currentYear]);
  
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await invoke<OfficeSummary[]>('get_dashboard_data', {
        year: currentYear,
        month: currentMonth,
      });
      
      setAllOffices(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter offices
  const filteredOffices = allOffices.filter(office => {
    // State filter
    if (filters.state && extractState(office.office_name) !== filters.state) {
      return false;
    }
    
    // DFO filter
    if (filters.dfo && office.dfo !== filters.dfo) {
      return false;
    }
    
    // Model filter
    if (filters.model && office.model !== filters.model) {
      return false;
    }
    
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesName = office.office_name.toLowerCase().includes(searchLower);
      const matchesId = office.office_id.toString().includes(searchLower);
      if (!matchesName && !matchesId) {
        return false;
      }
    }
    
    // Data status filter
    if (filters.dataStatus && filters.dataStatus !== 'all') {
      const status = getDataStatus(office);
      if (status !== filters.dataStatus) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort offices
  const sortedOffices = [...filteredOffices].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.office_name.localeCompare(b.office_name);
      
      case 'office_id_asc':
        return a.office_id - b.office_id;
      
      case 'revenue_desc':
        return (b.revenue || 0) - (a.revenue || 0);
      
      case 'lab_exp_desc':
        return (b.lab_exp_percent || 0) - (a.lab_exp_percent || 0);
      
      case 'latest_first':
        // Sort by year desc, then month desc
        if (a.latest_year !== b.latest_year) {
          return (b.latest_year || 0) - (a.latest_year || 0);
        }
        return (b.latest_month || 0) - (a.latest_month || 0);
      
      default:
        return 0;
    }
  });
  
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Office Overview Dashboard</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Office Overview Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Office Overview Dashboard</h1>
        <div className="text-right">
          <p className="text-sm text-gray-600">Viewing data for</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>
      
      {/* Summary Bar */}
      <DashboardSummary
        offices={allOffices}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
      
      {/* Filters */}
      <DashboardFilters
        offices={allOffices}
        filters={filters}
        sortBy={sortBy}
        onFiltersChange={setFilters}
        onSortChange={setSortBy}
      />
      
      {/* Results Count */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{sortedOffices.length}</span> of{' '}
          <span className="font-semibold">{allOffices.length}</span> offices
        </p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        >
          ↻ Refresh Data
        </button>
      </div>
      
      {/* Office Cards Grid */}
      {sortedOffices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedOffices.map(office => (
            <OfficeCard
              key={office.office_id}
              office={office}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No offices match your filters</p>
          <button
            onClick={() => setFilters({
              state: undefined,
              dfo: undefined,
              model: undefined,
              searchTerm: undefined,
              dataStatus: 'all',
            })}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
