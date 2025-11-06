import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, DollarSign, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import type { DashboardOverview } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import AlertBadge from '../components/AlertBadge';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getOverview();
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, labs } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Operations Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Real-time overview of all laboratory locations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Labs</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalLabs}</p>
            </div>
            <Building2 className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalEmployees}</p>
            </div>
            <Users className="text-green-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
            <DollarSign className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Alerts</p>
              <div className="flex space-x-2 mt-2">
                <span className="alert-badge alert-red">{summary.alertCounts.red}</span>
                <span className="alert-badge alert-yellow">{summary.alertCounts.yellow}</span>
                <span className="alert-badge alert-green">{summary.alertCounts.green}</span>
              </div>
            </div>
            <AlertCircle className="text-red-600" size={40} />
          </div>
        </div>
      </div>

      {/* Labs Grid */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Laboratory Locations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <Link
              key={lab.id}
              to={`/labs/${lab.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {lab.city}, {lab.state}
                  </h4>
                  <p className="text-sm text-gray-600">Office #{lab.officeId}</p>
                </div>
                <AlertBadge level={lab.alertLevel} />
              </div>

              {/* Quick Stats */}
              {lab.currentMetric && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold">
                      {formatCurrency(lab.currentMetric.practiceRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Denture Units:</span>
                    <span className="font-semibold">{lab.currentMetric.dentureUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Patients:</span>
                    <span className="font-semibold">{lab.currentMetric.patientVolume}</span>
                  </div>
                  {lab.percentages && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Lab Expenses:</span>
                        <span
                          className={`font-semibold ${
                            lab.percentages.totalLabExpensesPercent > 13
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {formatPercent(lab.percentages.totalLabExpensesPercent)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Personnel:</span>
                        <span
                          className={`font-semibold ${
                            lab.percentages.personnelExpensesPercent > 7
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {formatPercent(lab.percentages.personnelExpensesPercent)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-4">
                {lab.hasBacklog && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                    Backlog
                  </span>
                )}
                {lab.hasOvertime && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                    Overtime
                  </span>
                )}
                {lab.laborModel < -1 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                    Understaffed
                  </span>
                )}
                {lab.standardizationComplete && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Graduated
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <p>{lab.labManagerName}</p>
                  <p>{lab.totalStaff} staff members</p>
                </div>
                <ArrowRight className="text-primary-600" size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {labs.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No laboratories found</p>
          <Link to="/labs" className="btn btn-primary mt-4 inline-block">
            Add Your First Lab
          </Link>
        </div>
      )}
    </div>
  );
}
