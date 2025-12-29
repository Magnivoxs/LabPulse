import { useState, useEffect, useMemo } from 'react';
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
  
  // Time period filter types and state
  type TimePeriod = 'current_month' | 'last_month' | 'qtd' | 'ytd' | 'custom';
  
  interface DateRange {
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
  }
  
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('current_month');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [customMonth, setCustomMonth] = useState<number>(currentMonth);
  const [customYear, setCustomYear] = useState<number>(currentYear);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Calculate date range based on selected period
  const getDateRange = (): DateRange => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    switch (selectedPeriod) {
      case 'current_month':
        return {
          startYear: currentYear,
          startMonth: currentMonth,
          endYear: currentYear,
          endMonth: currentMonth,
        };
      
      case 'last_month':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return {
          startYear: lastMonthYear,
          startMonth: lastMonth,
          endYear: lastMonthYear,
          endMonth: lastMonth,
        };
      
      case 'qtd':
        // Q1: Jan-Mar (1-3), Q2: Apr-Jun (4-6), Q3: Jul-Sep (7-9), Q4: Oct-Dec (10-12)
        const currentQuarter = Math.ceil(currentMonth / 3);
        const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
        return {
          startYear: currentYear,
          startMonth: quarterStartMonth,
          endYear: currentYear,
          endMonth: currentMonth,
        };
      
      case 'ytd':
        return {
          startYear: currentYear,
          startMonth: 1,
          endYear: currentYear,
          endMonth: currentMonth,
        };
      
      case 'custom':
        return {
          startYear: customYear,
          startMonth: customMonth,
          endYear: customYear,
          endMonth: customMonth,
        };
      
      default:
        return {
          startYear: currentYear,
          startMonth: currentMonth,
          endYear: currentYear,
          endMonth: currentMonth,
        };
    }
  };
  
  // Get period label for display
  const getPeriodLabel = (): string => {
    const range = getDateRange();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    switch (selectedPeriod) {
      case 'current_month':
        return `${monthNames[range.startMonth - 1]} ${range.startYear}`;
      
      case 'last_month':
        return `${monthNames[range.startMonth - 1]} ${range.startYear}`;
      
      case 'qtd':
        return `Q${Math.floor((range.startMonth - 1) / 3) + 1} ${range.startYear} (${monthNames[range.startMonth - 1]} - ${monthNames[range.endMonth - 1]})`;
      
      case 'ytd':
        return `YTD ${range.startYear} (Jan - ${monthNames[range.endMonth - 1]})`;
      
      case 'custom':
        return `${monthNames[customMonth - 1]} ${customYear}`;
      
      default:
        return '';
    }
  };
  
  // Load dashboard data when period changes
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, customRange]);
  
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const range = getDateRange();
      console.log('Loading dashboard with date range:', range);
      const data = await invoke<OfficeSummary[]>('get_dashboard_data', {
        startYear: range.startYear,
        startMonth: range.startMonth,
        endYear: range.endYear,
        endMonth: range.endMonth,
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
      
      {/* Time Period Filter Bar */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Period Label */}
          <div className="text-sm text-gray-600">
            Showing data for: <span className="font-semibold text-gray-900">{getPeriodLabel()}</span>
          </div>
          
          {/* Period Selector Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPeriod('current_month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'current_month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Current Month
            </button>
            
            <button
              onClick={() => setSelectedPeriod('last_month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'last_month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
            
            <button
              onClick={() => setSelectedPeriod('qtd')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'qtd'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quarter to Date
            </button>
            
            <button
              onClick={() => setSelectedPeriod('ytd')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'ytd'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year to Date
            </button>
            
            <button
              onClick={() => {
                setShowCustomPicker(!showCustomPicker);
                if (!showCustomPicker) {
                  setSelectedPeriod('custom');
                }
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Month
            </button>
          </div>
        </div>
        
        {/* Custom Month Picker */}
        {showCustomPicker && (
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={customMonth}
                  onChange={(e) => {
                    setCustomMonth(parseInt(e.target.value));
                    setSelectedPeriod('custom');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={customYear}
                  onChange={(e) => {
                    setCustomYear(parseInt(e.target.value));
                    setSelectedPeriod('custom');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  loadDashboardData();
                  setShowCustomPicker(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors self-end"
              >
                Apply
              </button>
              
              <button
                onClick={() => {
                  setShowCustomPicker(false);
                  setSelectedPeriod('current_month');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors self-end"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
