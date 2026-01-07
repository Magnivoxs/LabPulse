import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useLocation } from 'react-router-dom';
import MonthOfficeSelector from '../components/MonthOfficeSelector';
import FinancialEntryForm from '../components/FinancialEntryForm';
import VolumeEntryForm from '../components/VolumeEntryForm';
import NotesSection from '../components/NotesSection';
import { DataEntryTab } from '../types/DataEntry';

interface ImportSummary {
  filename: string;
  rows_processed: number;
  rows_inserted: number;
  rows_updated: number;
  warnings: string[];
}

export default function DataEntry() {
  // Import state
  const [importing, setImporting] = useState<string>('');
  const [lastImport, setLastImport] = useState<ImportSummary | null>(null);
  const [showImportSection, setShowImportSection] = useState(false);

  // Data entry state
  const [selectedOffice, setSelectedOffice] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Tab state
  const [activeTab, setActiveTab] = useState<DataEntryTab>('financial');
  
  // Data existence tracking
  const [hasFinancialData, setHasFinancialData] = useState(false);
  const [hasOperationsData, setHasOperationsData] = useState(false);
  const [hasVolumeData, setHasVolumeData] = useState(false);
  const [hasNotesData, setHasNotesData] = useState(false);
  
  // Operations data state for enhanced staffing tracking
  const [operationsData, setOperationsData] = useState({
    backlog_case_count: '',
    overtime_value: '',
    current_staff: '',
    required_staff: '',
    staffing_trend: '',
  });
  
  // Data status tracking
  const [dataStatus, setDataStatus] = useState({
    financial: false,
    operations: false,
    volume: false,
    notes: false,
  });
  
  const [saving, setSaving] = useState(false);

  const location = useLocation();

  // Handle navigation from dashboard
  useEffect(() => {
    if (location.state) {
      const { officeId, month, year } = location.state as {
        officeId?: number;
        month?: number;
        year?: number;
      };
      
      if (officeId !== undefined) {
        setSelectedOffice(officeId);
      }
      if (month !== undefined) {
        setSelectedMonth(month);
      }
      if (year !== undefined) {
        setSelectedYear(year);
      }
      
      // Clear the location state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load operations data when office/month/year changes
  useEffect(() => {
    if (selectedOffice) {
      loadOperationsData(selectedOffice, selectedYear, selectedMonth);
    }
  }, [selectedOffice, selectedYear, selectedMonth]);

  const handleImport = async (importType: 'offices' | 'staff' | 'contacts' | 'bulk_financials' | 'bulk_weekly_volume') => {
    setImporting(importType);
    setLastImport(null);

    try {
      const selected = await open({
        filters: [{
          name: 'Excel Files',
          extensions: ['xlsx', 'xls']
        }],
        multiple: false,
        directory: false,
        title: importType === 'bulk_financials' 
          ? 'Select labpulse_import.xlsx file' 
          : importType === 'bulk_weekly_volume'
          ? 'Select backlog tracker file'
          : `Select ${importType} XLSX file`
      });

      if (!selected || selected === null) {
        setImporting('');
        return;
      }

      let result: ImportSummary;
      if (importType === 'offices') {
        result = await invoke<ImportSummary>('import_offices_file', { filePath: selected });
      } else if (importType === 'staff') {
        result = await invoke<ImportSummary>('import_staff_file', { filePath: selected });
      } else if (importType === 'contacts') {
        result = await invoke<ImportSummary>('import_contacts_file', { filePath: selected });
      } else if (importType === 'bulk_weekly_volume') {
        result = await invoke<ImportSummary>('import_bulk_weekly_volume', { filePath: selected });
      } else {
        result = await invoke<ImportSummary>('import_bulk_financials', { filePath: selected });
      }

      setLastImport(result);
    } catch (err) {
      console.error('Import error:', err);
      alert(`Import failed: ${err}`);
    } finally {
      setImporting('');
    }
  };

  // Load operations data with enhanced staffing tracking
  const loadOperationsData = async (officeId: number, year: number, month: number) => {
    try {
      const data = await invoke<any>('get_operations_data', {
        officeId,
        year,
        month,
      });
      
      if (data) {
        setOperationsData({
          backlog_case_count: data.backlog_case_count?.toString() || '',
          overtime_value: data.overtime_value?.toString() || '',
          current_staff: data.current_staff?.toString() || '',
          required_staff: data.required_staff?.toString() || '',
          staffing_trend: data.staffing_trend?.toString() || '',
        });
        setDataStatus(prev => ({ ...prev, operations: true }));
        setHasOperationsData(true);
      } else {
        setOperationsData({
          backlog_case_count: '',
          overtime_value: '',
          current_staff: '',
          required_staff: '',
          staffing_trend: '',
        });
        setDataStatus(prev => ({ ...prev, operations: false }));
        setHasOperationsData(false);
      }
    } catch (err) {
      console.error('Failed to load operations data:', err);
      setDataStatus(prev => ({ ...prev, operations: false }));
      setHasOperationsData(false);
    }
  };

  // Save operations data with enhanced staffing tracking
  const saveOperationsData = async () => {
    if (!selectedOffice) return;
    
    setSaving(true);
    try {
      await invoke('save_operations_data', {
        officeId: selectedOffice,
        year: selectedYear,
        month: selectedMonth,
        backlogCaseCount: operationsData.backlog_case_count ? parseInt(operationsData.backlog_case_count) : null,
        overtimeValue: operationsData.overtime_value ? parseFloat(operationsData.overtime_value) : null,
        currentStaff: operationsData.current_staff ? parseFloat(operationsData.current_staff) : null,
        requiredStaff: operationsData.required_staff ? parseFloat(operationsData.required_staff) : null,
        staffingTrend: operationsData.staffing_trend ? parseFloat(operationsData.staffing_trend) : null,
      });
      
      alert('Operations data saved successfully!');
      await loadOperationsData(selectedOffice, selectedYear, selectedMonth);
    } catch (err) {
      console.error('Failed to save operations data:', err);
      alert('Failed to save operations data');
    } finally {
      setSaving(false);
    }
  };

  // Calculate overall data status
  const hasAnyData = hasFinancialData || hasOperationsData || hasVolumeData || hasNotesData;

  // Enhanced Operations Entry Form Component with Staffing Tracking
  function EnhancedOperationsEntryForm({
    officeId,
    year,
    month,
    onDataChange,
  }: {
    officeId: number | null;
    year: number;
    month: number;
    onDataChange: () => void;
  }) {
    const [formData, setFormData] = useState({
      backlog_case_count: '',
      overtime_value: '',
      current_staff: '',
      required_staff: '',
      staffing_trend: '',
    });
    const [saving, setSaving] = useState(false);

    // Load operations data
    useEffect(() => {
      if (officeId) {
        loadData();
      }
    }, [officeId, year, month]);

    const loadData = async () => {
      if (!officeId) return;
      
      try {
        const data = await invoke<any>('get_operations_data', {
          officeId,
          year,
          month,
        });
        
        if (data) {
          setFormData({
            backlog_case_count: data.backlog_case_count?.toString() || '',
            overtime_value: data.overtime_value?.toString() || '',
            current_staff: data.current_staff?.toString() || '',
            required_staff: data.required_staff?.toString() || '',
            staffing_trend: data.staffing_trend?.toString() || '',
          });
        } else {
          setFormData({
            backlog_case_count: '',
            overtime_value: '',
            current_staff: '',
            required_staff: '',
            staffing_trend: '',
          });
        }
      } catch (err) {
        console.error('Failed to load operations data:', err);
      }
    };

    const handleSave = async () => {
      if (!officeId) return;
      
      setSaving(true);
      try {
        await invoke('save_operations_data', {
          officeId,
          year,
          month,
          backlogCaseCount: formData.backlog_case_count ? parseInt(formData.backlog_case_count) : null,
          overtimeValue: formData.overtime_value ? parseFloat(formData.overtime_value) : null,
          currentStaff: formData.current_staff ? parseFloat(formData.current_staff) : null,
          requiredStaff: formData.required_staff ? parseFloat(formData.required_staff) : null,
          staffingTrend: formData.staffing_trend ? parseFloat(formData.staffing_trend) : null,
        });
        
        alert('Operations data saved successfully!');
        onDataChange();
        await loadData();
      } catch (err) {
        console.error('Failed to save operations data:', err);
        alert('Failed to save operations data');
      } finally {
        setSaving(false);
      }
    };

    // Calculate staffing status
    const getStaffingStatus = () => {
      const current = parseFloat(formData.current_staff);
      const required = parseFloat(formData.required_staff);
      const trend = parseFloat(formData.staffing_trend);
      
      if (isNaN(current) || isNaN(required)) return null;
      
      if (trend > 0) {
        return { status: 'Overstaffed', color: 'text-orange-600 bg-orange-50', emoji: '🟠' };
      } else if (trend < 0) {
        return { status: 'Understaffed', color: 'text-red-600 bg-red-50', emoji: '🔴' };
      } else {
        return { status: 'Properly Staffed', color: 'text-green-600 bg-green-50', emoji: '🟢' };
      }
    };

    const staffingStatus = getStaffingStatus();

    if (!officeId) {
      return (
        <div className="text-center text-gray-500 py-8">
          Please select an office to enter operations data
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Operations Data Entry</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Operations Overview */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 mb-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Operations Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm opacity-90">Backlog Cases</div>
              <div className="text-3xl font-bold">
                {formData.backlog_case_count || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90">Overtime Value</div>
              <div className="text-3xl font-bold">
                {formData.overtime_value ? `$${parseFloat(formData.overtime_value).toLocaleString()}` : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90">Current Staff</div>
              <div className="text-3xl font-bold">
                {formData.current_staff || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90">Staffing Status</div>
              <div className="text-xl font-bold flex items-center gap-2">
                {staffingStatus ? (
                  <>
                    <span>{staffingStatus.emoji}</span>
                    <span>{staffingStatus.status}</span>
                  </>
                ) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Backlog Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📦</span>
            Backlog Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Cases in Backlog
              </label>
              <input
                type="number"
                value={formData.backlog_case_count}
                onChange={(e) => setFormData({ ...formData, backlog_case_count: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter total backlog count"
              />
              <p className="mt-1 text-sm text-gray-500">
                Total number of cases currently in backlog
              </p>
            </div>
          </div>
        </div>

        {/* Overtime Tracking */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            Overtime Tracking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Cost/Hours
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.overtime_value}
                onChange={(e) => setFormData({ ...formData, overtime_value: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter overtime value"
              />
              <p className="mt-1 text-sm text-gray-500">
                Overtime cost in dollars or total hours
              </p>
            </div>
          </div>
        </div>

        {/* Staffing Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">👥</span>
            Staffing Management
          </h3>
          
          {/* Staffing Status Alert */}
          {staffingStatus && (
            <div className={`mb-4 p-4 rounded-lg ${staffingStatus.color}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{staffingStatus.emoji}</span>
                <div>
                  <div className="font-semibold">{staffingStatus.status}</div>
                  <div className="text-sm">
                    {formData.staffing_trend && (
                      <>Trend: {parseFloat(formData.staffing_trend) > 0 ? '+' : ''}{formData.staffing_trend} FTE</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Staffed Positions
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.current_staff}
                onChange={(e) => setFormData({ ...formData, current_staff: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2.5"
              />
              <p className="mt-1 text-sm text-gray-500">
                Current FTE positions filled
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required FTE
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.required_staff}
                onChange={(e) => setFormData({ ...formData, required_staff: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2.3"
              />
              <p className="mt-1 text-sm text-gray-500">
                Required FTE based on workload
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staffing Trend
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.staffing_trend}
                onChange={(e) => setFormData({ ...formData, staffing_trend: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., +0.5 or -0.3"
              />
              <p className="mt-1 text-sm text-gray-500">
                Positive = Overstaffed, Negative = Understaffed
              </p>
            </div>
          </div>

          {/* Staffing Explanation */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Understanding Staffing Metrics:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Current Staff:</strong> Actual FTE positions filled (e.g., 2.5 FTE)</li>
              <li>• <strong>Required FTE:</strong> Needed FTE based on workload analysis</li>
              <li>• <strong>Trend:</strong> Current - Required (positive means overstaffed, negative means need more staff)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Data Entry</h1>

      {/* Collapsible Import Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <button
          onClick={() => setShowImportSection(!showImportSection)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Import Reference Data</span>
            <span className="text-sm text-gray-500">(One-time setup)</span>
          </div>
          <span className="text-gray-400">
            {showImportSection ? '▼' : '▶'}
          </span>
        </button>

        {showImportSection && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <p className="text-gray-600 mb-6 mt-4">
              Import office list, staff roster, and contact information from Excel files.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Office List</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import office names, addresses, DFOs, and models.
                </p>
                <button
                  onClick={() => handleImport('offices')}
                  disabled={importing !== ''}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {importing === 'offices' ? 'Importing...' : 'Import Offices'}
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Staff Roster</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import employee names, job titles, and hire dates.
                </p>
                <button
                  onClick={() => handleImport('staff')}
                  disabled={importing !== ''}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {importing === 'staff' ? 'Importing...' : 'Import Staff'}
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Lab Manager Contacts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import lab manager names and phone numbers.
                </p>
                <button
                  onClick={() => handleImport('contacts')}
                  disabled={importing !== ''}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {importing === 'contacts' ? 'Importing...' : 'Import Contacts'}
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Bulk Financial Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import monthly financial data from Excel file.
                </p>
                <button
                  onClick={() => handleImport('bulk_financials')}
                  disabled={importing !== ''}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {importing === 'bulk_financials' ? 'Importing...' : 'Import Financials'}
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Bulk Weekly Volume</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import weekly volume data from backlog tracker.
                </p>
                <button
                  onClick={() => handleImport('bulk_weekly_volume')}
                  disabled={importing !== ''}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {importing === 'bulk_weekly_volume' ? 'Importing...' : 'Import Weekly Volume'}
                </button>
              </div>
            </div>

            {lastImport && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Import Complete</h3>
                <div className="text-sm space-y-1">
                  <p><strong>File:</strong> {lastImport.filename.split('\\').pop()}</p>
                  <p><strong>Rows Processed:</strong> {lastImport.rows_processed}</p>
                  <p><strong>Rows Inserted:</strong> {lastImport.rows_inserted}</p>
                  <p><strong>Rows Updated:</strong> {lastImport.rows_updated}</p>
                </div>
                
                {lastImport.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-yellow-800">Warnings:</p>
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {lastImport.warnings.slice(0, 10).map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                      {lastImport.warnings.length > 10 && (
                        <li>...and {lastImport.warnings.length - 10} more warnings</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Month/Office Selector */}
      <div className="mb-6">
        <MonthOfficeSelector
          selectedOffice={selectedOffice}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onOfficeChange={setSelectedOffice}
          onMonthChange={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
          hasData={hasAnyData}
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('financial')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'financial'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                Financial
                {hasFinancialData && <span className="text-green-500">✓</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('operations')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'operations'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                Operations
                {hasOperationsData && <span className="text-green-500">✓</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('volume')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'volume'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                Volume
                {hasVolumeData && <span className="text-green-500">✓</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                Notes
                {hasNotesData && <span className="text-green-500">✓</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'financial' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Financial Data Entry</h2>
              <FinancialEntryForm
                officeId={selectedOffice}
                month={selectedMonth}
                year={selectedYear}
                onDataLoaded={setHasFinancialData}
              />
            </div>
          )}

          {activeTab === 'operations' && (
            <EnhancedOperationsEntryForm
              officeId={selectedOffice}
              year={selectedYear}
              month={selectedMonth}
              onDataChange={() => {
                if (selectedOffice) {
                  loadOperationsData(selectedOffice, selectedYear, selectedMonth);
                }
              }}
            />
          )}

          {activeTab === 'volume' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Volume Data Entry</h2>
              <VolumeEntryForm
                officeId={selectedOffice}
                month={selectedMonth}
                year={selectedYear}
                onDataLoaded={setHasVolumeData}
              />
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Monthly Notes</h2>
              <NotesSection
                officeId={selectedOffice}
                month={selectedMonth}
                year={selectedYear}
                onDataLoaded={setHasNotesData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
