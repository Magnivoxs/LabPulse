import { OfficeSummary, generateAlerts, getDataStatus } from '../types/Dashboard';

interface DashboardSummaryProps {
  offices: OfficeSummary[];
  currentMonth: number;
  currentYear: number;
}

export default function DashboardSummary({ 
  offices, 
  currentMonth, 
  currentYear 
}: DashboardSummaryProps) {
  // Calculate statistics
  const totalOffices = offices.length;
  
  // Offices with current month data
  const officesWithCurrentData = offices.filter(
    o => o.latest_month === currentMonth && o.latest_year === currentYear
  ).length;
  
  // Offices with complete data
  const completeOffices = offices.filter(o => getDataStatus(o) === 'complete').length;
  
  // Total alerts
  const totalAlerts = offices.reduce((sum, office) => {
    return sum + generateAlerts(office).length;
  }, 0);
  
  // Critical alerts count
  const criticalAlerts = offices.reduce((sum, office) => {
    return sum + generateAlerts(office).filter(a => a.severity === 'critical').length;
  }, 0);
  
  // Average revenue (only offices with data)
  const officesWithRevenue = offices.filter(o => o.revenue !== undefined);
  const avgRevenue = officesWithRevenue.length > 0
    ? officesWithRevenue.reduce((sum, o) => sum + (o.revenue || 0), 0) / officesWithRevenue.length
    : 0;
  
  // Average lab expense % (only offices with data)
  const officesWithLabExp = offices.filter(o => o.lab_exp_percent !== undefined);
  const avgLabExp = officesWithLabExp.length > 0
    ? officesWithLabExp.reduce((sum, o) => sum + (o.lab_exp_percent || 0), 0) / officesWithLabExp.length
    : 0;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Offices */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-sm opacity-90 mb-1">Total Offices</p>
          <p className="text-3xl font-bold">{totalOffices}</p>
        </div>
        
        {/* Current Month Data */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-sm opacity-90 mb-1">Current Month</p>
          <p className="text-3xl font-bold">{officesWithCurrentData}</p>
          <p className="text-xs opacity-75 mt-1">
            {Math.round((officesWithCurrentData / totalOffices) * 100)}% coverage
          </p>
        </div>
        
        {/* Complete Data */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-sm opacity-90 mb-1">Complete</p>
          <p className="text-3xl font-bold">{completeOffices}</p>
          <p className="text-xs opacity-75 mt-1">All data types</p>
        </div>
        
        {/* Total Alerts */}
        <div className={`rounded-lg p-4 backdrop-blur ${
          criticalAlerts > 0 ? 'bg-red-500/30' : 'bg-white/10'
        }`}>
          <p className="text-sm opacity-90 mb-1">Total Alerts</p>
          <p className="text-3xl font-bold">{totalAlerts}</p>
          {criticalAlerts > 0 && (
            <p className="text-xs font-semibold mt-1">
              {criticalAlerts} critical
            </p>
          )}
        </div>
        
        {/* Average Revenue */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-sm opacity-90 mb-1">Avg Revenue</p>
          <p className="text-2xl font-bold">
            ${(avgRevenue / 1000).toFixed(0)}K
          </p>
          <p className="text-xs opacity-75 mt-1">
            {officesWithRevenue.length} offices
          </p>
        </div>
        
        {/* Average Lab Exp % */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-sm opacity-90 mb-1">Avg Lab Exp</p>
          <p className="text-2xl font-bold">{avgLabExp.toFixed(1)}%</p>
          <p className="text-xs opacity-75 mt-1">
            {officesWithLabExp.length} offices
          </p>
        </div>
      </div>
    </div>
  );
}

