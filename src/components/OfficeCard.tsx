import { useNavigate } from 'react-router-dom';
import { OfficeSummary, generateAlerts, getDataStatus, formatMonthYear } from '../types/Dashboard';

interface OfficeCardProps {
  office: OfficeSummary;
  currentMonth: number;
  currentYear: number;
}

export default function OfficeCard({ office, currentMonth, currentYear }: OfficeCardProps) {
  const navigate = useNavigate();
  const alerts = generateAlerts(office);
  const dataStatus = getDataStatus(office);
  
  // Determine if this office has current month data
  const hasCurrentMonthData = 
    office.latest_month === currentMonth && 
    office.latest_year === currentYear;
  
  // Card border color based on status
  const getBorderColor = () => {
    if (alerts.some(a => a.severity === 'critical')) return 'border-red-500';
    if (alerts.some(a => a.severity === 'warning')) return 'border-yellow-500';
    if (dataStatus === 'complete') return 'border-green-500';
    if (dataStatus === 'partial') return 'border-blue-400';
    return 'border-gray-300';
  };
  
  // Badge color based on data status
  const getStatusBadge = () => {
    switch (dataStatus) {
      case 'complete':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">✓ Complete</span>;
      case 'partial':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">Partial</span>;
      case 'none':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">No Data</span>;
    }
  };
  
  const handleClick = () => {
    // Navigate to data entry with this office pre-selected
    navigate('/data-entry', { 
      state: { 
        officeId: office.office_id,
        month: currentMonth,
        year: currentYear
      } 
    });
  };
  
  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 ${getBorderColor()}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{office.office_id}</h3>
          <p className="text-sm text-gray-600">{office.office_name}</p>
        </div>
        {getStatusBadge()}
      </div>
      
      {/* Model & DFO */}
      <div className="flex gap-2 mb-3 text-xs">
        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">{office.model}</span>
        {office.dfo && (
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">{office.dfo}</span>
        )}
      </div>
      
      {/* Latest Data Indicator */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <p className="text-xs text-gray-500">Latest Data:</p>
        <p className={`text-sm font-medium ${hasCurrentMonthData ? 'text-green-600' : 'text-gray-700'}`}>
          {formatMonthYear(office.latest_month, office.latest_year)}
        </p>
      </div>
      
      {/* Metrics */}
      {office.revenue !== undefined ? (
        <div className="space-y-2 mb-3">
          <div>
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-lg font-bold text-gray-900">
              ${(office.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            {office.lab_exp_percent !== undefined && office.lab_exp_percent !== null && (
              <div>
                <p className="text-xs text-gray-500">Lab Exp %</p>
                <p className={`font-semibold ${
                  office.lab_exp_percent > 25 ? 'text-red-600' : 
                  office.lab_exp_percent > 20 ? 'text-yellow-600' : 
                  'text-gray-900'
                }`}>
                  {(office.lab_exp_percent || 0).toFixed(1)}%
                </p>
              </div>
            )}
            
            {office.personnel_percent !== undefined && office.personnel_percent !== null && (
              <div>
                <p className="text-xs text-gray-500">Personnel %</p>
                <p className={`font-semibold ${
                  office.personnel_percent > 20 ? 'text-red-600' : 
                  office.personnel_percent > 15 ? 'text-yellow-600' : 
                  'text-gray-900'
                }`}>
                  {(office.personnel_percent || 0).toFixed(1)}%
                </p>
              </div>
            )}
            
            {office.backlog_count !== undefined && office.backlog_count !== null && (
              <div>
                <p className="text-xs text-gray-500">Backlog</p>
                <p className={`font-semibold ${
                  (office.backlog_count || 0) > 100 ? 'text-red-600' : 
                  (office.backlog_count || 0) > 50 ? 'text-yellow-600' : 
                  'text-gray-900'
                }`}>
                  {office.backlog_count || 0}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-3 text-center text-gray-400 py-4">
          <p className="text-sm">No financial data</p>
        </div>
      )}
      
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1">
          {alerts.slice(0, 2).map((alert, idx) => (
            <div
              key={idx}
              className={`text-xs px-2 py-1 rounded ${
                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              {alert.message}
            </div>
          ))}
          {alerts.length > 2 && (
            <p className="text-xs text-gray-500 pl-2">+{alerts.length - 2} more alerts</p>
          )}
        </div>
      )}
      
      {/* Action Hint */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Click to enter data →
        </p>
      </div>
    </div>
  );
}

