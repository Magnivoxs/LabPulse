import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ComplianceData {
  office_id: number;
  office_name: string;
  dfo: string;
  total_weeks: number;
  submitted_weeks: number;
  compliance_rate: number;
  current_streak: number;
  longest_streak: number;
  recent_submissions: number[];  // Array of 1s and 0s for last 10 weeks
}

export default function Compliance() {
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'compliance' | 'streak' | 'name'>('compliance');
  const [dfoFilter, setDfoFilter] = useState<string>('all');

  // Load compliance data
  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const data = await invoke<ComplianceData[]>('get_compliance_data');
      setComplianceData(data);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, []);

  // Filter by DFO
  const filteredData = dfoFilter === 'all' 
    ? complianceData 
    : complianceData.filter(d => d.dfo === dfoFilter);

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'compliance':
        return b.compliance_rate - a.compliance_rate;
      case 'streak':
        return b.current_streak - a.current_streak;
      case 'name':
        return a.office_name.localeCompare(b.office_name);
      default:
        return 0;
    }
  });

  // Get rank medal
  const getRankMedal = (index: number) => {
    if (sortBy !== 'compliance') return null;
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  // Get compliance status color
  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    if (rate >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Overall statistics
  const overallStats = {
    totalOffices: complianceData.length,
    avgCompliance: complianceData.length > 0 
      ? complianceData.reduce((sum, d) => sum + d.compliance_rate, 0) / complianceData.length 
      : 0,
    highestCompliance: complianceData.length > 0 
      ? Math.max(...complianceData.map(d => d.compliance_rate)) 
      : 0,
    lowestCompliance: complianceData.length > 0 
      ? Math.min(...complianceData.map(d => d.compliance_rate)) 
      : 0,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Submission Compliance</h1>
        <p className="text-gray-600">Track weekly backlog submission consistency across all offices</p>
      </div>

      {/* Overall Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 mb-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm opacity-90">Total Offices</div>
            <div className="text-3xl font-bold">{overallStats.totalOffices}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Average Compliance</div>
            <div className="text-3xl font-bold">{overallStats.avgCompliance.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Highest</div>
            <div className="text-3xl font-bold">{overallStats.highestCompliance.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Lowest</div>
            <div className="text-3xl font-bold">{overallStats.lowestCompliance.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="compliance">Compliance Rate</option>
              <option value="streak">Current Streak</option>
              <option value="name">Office Name</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by DFO</label>
            <select
              value={dfoFilter}
              onChange={(e) => setDfoFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All DFOs</option>
              <option value="Candi Abt">Candi Abt</option>
              <option value="Balt Torres">Balt Torres</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compliance Rankings Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading compliance data...</div>
      ) : sortedData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No compliance data available</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DFO</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Rate</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Current Streak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent (Last 10 Weeks)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((office, index) => {
                const medal = getRankMedal(index);
                const isTopThree = sortBy === 'compliance' && index < 3;
                const isBottomThree = sortBy === 'compliance' && index >= sortedData.length - 3;
                
                let rowClass = 'hover:bg-gray-50';
                if (isTopThree) {
                  rowClass = index === 0 ? 'bg-yellow-50 hover:bg-yellow-100' :
                             index === 1 ? 'bg-gray-100 hover:bg-gray-150' :
                             'bg-orange-50 hover:bg-orange-100';
                } else if (isBottomThree) {
                  rowClass = 'bg-red-50 hover:bg-red-100';
                }
                
                return (
                  <tr key={office.office_id} className={rowClass}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-bold text-lg">
                          {medal || index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {office.office_id} - {office.office_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{office.dfo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getComplianceColor(office.compliance_rate)}`}>
                        {office.compliance_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {office.submitted_weeks} / {office.total_weeks}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {office.current_streak > 0 ? `🔥 ${office.current_streak}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {office.recent_submissions.map((submitted, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded ${submitted === 1 ? 'bg-green-500' : 'bg-red-300'}`}
                            title={submitted === 1 ? 'Submitted' : 'Missing'}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
