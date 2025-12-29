import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface RankingMetric {
  office_id: number;
  office_name: string;
  address: string;
  dfo: string;
  value: number | null;
  rank: number;
}

type MetricType = 
  | 'revenue'
  | 'lab_expense_percent'
  | 'personnel_expense_percent'
  | 'total_weekly_units'
  | 'backlog_in_lab'
  | 'backlog_in_clinic'
  | 'data_completeness';

type TimePeriod = 'current_month' | 'last_month' | 'qtd' | 'ytd' | 'custom';

interface DateRange {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

export default function Rankings() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('revenue');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('current_month');
  const [rankings, setRankings] = useState<RankingMetric[]>([]);
  const [loading, setLoading] = useState(false);

  // Get current date
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const getDateRange = (): DateRange => {
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
      
      default:
        return {
          startYear: currentYear,
          startMonth: currentMonth,
          endYear: currentYear,
          endMonth: currentMonth,
        };
    }
  };

  const getPeriodLabel = (): string => {
    const range = getDateRange();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    switch (selectedPeriod) {
      case 'current_month':
        return `${monthNames[range.startMonth - 1]} ${range.startYear}`;
      case 'last_month':
        return `${monthNames[range.startMonth - 1]} ${range.startYear}`;
      case 'qtd':
        return `Q${Math.floor((range.startMonth - 1) / 3) + 1} ${range.startYear}`;
      case 'ytd':
        return `YTD ${range.startYear}`;
      default:
        return '';
    }
  };

  const sortAndRankData = (data: any[]): RankingMetric[] => {
    // Determine sort direction based on metric
    // For percentages and backlogs, lower is better
    const lowerIsBetter = ['lab_expense_percent', 'personnel_expense_percent', 'backlog_in_lab', 'backlog_in_clinic'].includes(selectedMetric);
    
    // Filter out offices without data and sort
    const withData = data.filter(item => item.value !== null);
    const sorted = withData.sort((a, b) => {
      if (lowerIsBetter) {
        return (a.value || Infinity) - (b.value || Infinity);
      } else {
        return (b.value || -Infinity) - (a.value || -Infinity);
      }
    });
    
    // Assign ranks
    const ranked: RankingMetric[] = sorted.map((item, index) => ({
      office_id: item.office_id,
      office_name: item.office_name,
      address: item.address,
      dfo: item.dfo,
      value: item.value,
      rank: index + 1,
    }));
    
    return ranked;
  };

  const formatValue = (value: number): string => {
    if (selectedMetric === 'revenue') {
      return `$${Math.round(value).toLocaleString()}`;
    } else if (selectedMetric.includes('percent')) {
      return `${value.toFixed(1)}%`;
    } else if (selectedMetric === 'data_completeness') {
      return `${value.toFixed(0)}%`;
    } else {
      return Math.round(value).toString();
    }
  };

  const getQuickStats = () => {
    if (rankings.length === 0) return { best: '--', average: '--', worst: '--' };
    
    const values = rankings.map(r => r.value).filter(v => v !== null) as number[];
    if (values.length === 0) return { best: '--', average: '--', worst: '--' };
    
    const best = values[0]; // First after sorting
    const worst = values[values.length - 1]; // Last after sorting
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
      best: formatValue(best),
      average: formatValue(average),
      worst: formatValue(worst),
    };
  };

  const loadRankings = async () => {
    setLoading(true);
    try {
      const range = getDateRange();
      const data = await invoke<any[]>('get_office_rankings', {
        metric: selectedMetric,
        startYear: range.startYear,
        startMonth: range.startMonth,
        endYear: range.endYear,
        endMonth: range.endMonth,
      });
      
      // Sort and rank the data
      const sorted = sortAndRankData(data);
      setRankings(sorted);
    } catch (err) {
      console.error('Failed to load rankings:', err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [selectedMetric, selectedPeriod]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Office Rankings</h1>
        <div className="text-sm text-gray-600">
          Viewing data for <span className="font-semibold text-gray-900">{getPeriodLabel()}</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Metric Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rank By</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="revenue">Revenue</option>
              <option value="lab_expense_percent">Lab Expense %</option>
              <option value="personnel_expense_percent">Personnel Expense %</option>
              <option value="total_weekly_units">Total Weekly Units</option>
              <option value="backlog_in_lab">Backlog in Lab</option>
              <option value="backlog_in_clinic">Backlog in Clinic</option>
              <option value="data_completeness">Data Completeness</option>
            </select>
          </div>

          {/* Time Period Buttons */}
          <div className="flex gap-2 ml-auto">
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
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 mb-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm opacity-90">Best</div>
            <div className="text-2xl font-bold">{getQuickStats().best}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Average</div>
            <div className="text-2xl font-bold">{getQuickStats().average}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Worst</div>
            <div className="text-2xl font-bold">{getQuickStats().worst}</div>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading rankings...</div>
        ) : rankings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No data available for selected period</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DFO</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankings.map((ranking) => {
                const isTopThree = ranking.rank <= 3;
                const isBottomThree = ranking.rank > rankings.length - 3;
                
                let rowClass = 'hover:bg-gray-50';
                if (isTopThree) {
                  rowClass = ranking.rank === 1 ? 'bg-yellow-50 hover:bg-yellow-100' :
                             ranking.rank === 2 ? 'bg-gray-100 hover:bg-gray-150' :
                             'bg-orange-50 hover:bg-orange-100';
                } else if (isBottomThree) {
                  rowClass = 'bg-red-50 hover:bg-red-100';
                }
                
                return (
                  <tr key={ranking.office_id} className={rowClass}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-bold text-lg">
                          {ranking.rank === 1 ? '🥇' : ranking.rank === 2 ? '🥈' : ranking.rank === 3 ? '🥉' : ranking.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ranking.office_id} - {ranking.office_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{ranking.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{ranking.dfo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatValue(ranking.value || 0)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
