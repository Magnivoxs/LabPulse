import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import type { LabDashboard } from '../types';
import { formatCurrency, formatPercent, formatMonthYear, formatDate } from '../utils/formatters';
import AlertBadge from '../components/AlertBadge';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function LabDetailPage() {
  const { labId } = useParams<{ labId: string }>();
  const [data, setData] = useState<LabDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (labId) {
      loadData();
    }
  }, [labId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getLabDashboard(labId!);
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load lab details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lab details...</p>
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

  const { lab, metrics, anomalies, alertLevel } = data;

  // Prepare chart data (last 12 months)
  const chartData = metrics.slice(0, 12).reverse().map((m) => ({
    name: formatMonthYear(m.month, m.year),
    revenue: m.practiceRevenue,
    dentures: m.dentureUnits,
    patients: m.patientVolume,
    labExpenses: m.totalLabExpenses,
    labExpensesPercent: m.percentages.totalLabExpensesPercent,
    personnelExpensesPercent: m.percentages.personnelExpensesPercent,
  }));

  // Latest metric
  const latestMetric = metrics[0];
  const expenseBreakdown = latestMetric
    ? [
        { name: 'Teeth Supplies', value: latestMetric.teethSupplies },
        { name: 'Lab Supplies', value: latestMetric.labSupplies },
        { name: 'Personnel', value: latestMetric.totalPersonnelExpenses },
        { name: 'Overtime', value: latestMetric.overtimeExpenses },
        { name: 'Bonuses', value: latestMetric.bonuses },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {lab.city}, {lab.state}
            </h2>
            <p className="text-gray-600 mt-1">Office #{lab.officeId}</p>
          </div>
          <AlertBadge level={alertLevel} size="lg" />
        </div>
      </div>

      {/* Lab Info Card */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Laboratory Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Practice Model</p>
            <p className="font-semibold">{lab.practiceModel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Managing Dentist</p>
            <p className="font-semibold">{lab.managingDentist}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Director Field Ops</p>
            <p className="font-semibold">{lab.directorFieldOps}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Standardization</p>
            <p className="font-semibold">{lab.standardizationStatus}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lab Manager</p>
            <p className="font-semibold">{lab.labManagerName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Staff</p>
            <p className="font-semibold">{lab.totalStaff}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Labor Model</p>
            <p
              className={`font-semibold ${
                lab.laborModel < -1
                  ? 'text-red-600'
                  : lab.laborModel > 1
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}
            >
              {lab.laborModel.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contact</p>
            <p className="font-semibold text-sm">{lab.phone}</p>
          </div>
        </div>
      </div>

      {/* Anomalies Alert */}
      {anomalies && Object.values(anomalies).some((v) => v) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-600 mr-3 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Detected Issues</h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                {anomalies.hasHighLabExpenses && (
                  <li>• Lab expenses exceed 13% of revenue</li>
                )}
                {anomalies.hasHighPersonnelExpenses && (
                  <li>• Personnel expenses exceed 7% of revenue</li>
                )}
                {anomalies.hasBacklog && <li>• Current backlog exists</li>}
                {anomalies.hasOvertime && <li>• Overtime being used</li>}
                {anomalies.isUnderstaffed && <li>• Lab is understaffed</li>}
                {anomalies.isOverstaffed && <li>• Lab may be overstaffed</li>}
                {anomalies.revenueDecline && (
                  <li>• Revenue declining compared to previous period</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Current Month KPIs */}
      {latestMetric && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Current Period ({formatMonthYear(latestMetric.month, latestMetric.year)})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Practice Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(latestMetric.practiceRevenue)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Denture Units</p>
              <p className="text-3xl font-bold text-gray-900">{latestMetric.dentureUnits}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Patient Volume</p>
              <p className="text-3xl font-bold text-gray-900">{latestMetric.patientVolume}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Lab Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(latestMetric.totalLabExpenses)}
              </p>
              <p
                className={`text-lg font-semibold mt-1 ${
                  latestMetric.percentages.totalLabExpensesPercent > 13
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {formatPercent(latestMetric.percentages.totalLabExpensesPercent)}
              </p>
              <p className="text-xs text-gray-500">Goal: &lt; 13%</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Personnel Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(latestMetric.totalPersonnelExpenses)}
              </p>
              <p
                className={`text-lg font-semibold mt-1 ${
                  latestMetric.percentages.personnelExpensesPercent > 7
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {formatPercent(latestMetric.percentages.personnelExpensesPercent)}
              </p>
              <p className="text-xs text-gray-500">Goal: &lt; 7%</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Teeth Supplies</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(latestMetric.teethSupplies)}
              </p>
              <p className="text-lg font-semibold mt-1 text-gray-700">
                {formatPercent(latestMetric.percentages.teethSuppliesPercent)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 mb-1">Lab Supplies</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(latestMetric.labSupplies)}
              </p>
              <p className="text-lg font-semibold mt-1 text-gray-700">
                {formatPercent(latestMetric.percentages.labSuppliesPercent)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h4 className="font-semibold mb-4">Revenue Trend (12 Months)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Production Metrics */}
        <div className="card">
          <h4 className="font-semibold mb-4">Production Metrics (12 Months)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="dentures" stroke="#8b5cf6" name="Denture Units" />
              <Line type="monotone" dataKey="patients" stroke="#10b981" name="Patients" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Ratios */}
        <div className="card">
          <h4 className="font-semibold mb-4">Expense Ratios (% of Revenue)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: number) => formatPercent(value)} />
              <Legend />
              <Bar dataKey="labExpensesPercent" fill="#f59e0b" name="Lab Expenses %" />
              <Bar dataKey="personnelExpensesPercent" fill="#ef4444" name="Personnel %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        {latestMetric && (
          <div className="card">
            <h4 className="font-semibold mb-4">
              Current Expense Breakdown ({formatMonthYear(latestMetric.month, latestMetric.year)})
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Employee Roster */}
      {lab.employees && lab.employees.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="mr-2" size={24} />
            Employee Roster
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hire Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tenure
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lab.employees.map((employee) => {
                  const hireDate = new Date(employee.hireDate);
                  const tenure = Math.floor(
                    (Date.now() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                  );
                  return (
                    <tr key={employee.id}>
                      <td className="px-4 py-3 text-sm">{employee.name}</td>
                      <td className="px-4 py-3 text-sm">{employee.position}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(employee.hireDate)}</td>
                      <td className="px-4 py-3 text-sm">
                        {tenure} {tenure === 1 ? 'year' : 'years'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Staffing Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Lab Managers</p>
              <p className="text-xl font-bold">{lab.countLabManagers}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Full Techs</p>
              <p className="text-xl font-bold">{lab.countFullTechs}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Waxer Finishers</p>
              <p className="text-xl font-bold">{lab.countWaxerFinishers}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Processors</p>
              <p className="text-xl font-bold">{lab.countProcessors}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold">{lab.totalStaff}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
