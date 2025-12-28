import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useLocation } from 'react-router-dom';
import MonthOfficeSelector from '../components/MonthOfficeSelector';
import FinancialEntryForm from '../components/FinancialEntryForm';
import OperationsEntryForm from '../components/OperationsEntryForm';
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

  const handleImport = async (importType: 'offices' | 'staff' | 'contacts') => {
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
        title: `Select ${importType} XLSX file`
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
      } else {
        result = await invoke<ImportSummary>('import_contacts_file', { filePath: selected });
      }

      setLastImport(result);
    } catch (err) {
      console.error('Import error:', err);
      alert(`Import failed: ${err}`);
    } finally {
      setImporting('');
    }
  };

  // Calculate overall data status
  const hasAnyData = hasFinancialData || hasOperationsData || hasVolumeData || hasNotesData;

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <h2 className="text-2xl font-bold mb-6">Operations Data Entry</h2>
              <OperationsEntryForm
                officeId={selectedOffice}
                month={selectedMonth}
                year={selectedYear}
                onDataLoaded={setHasOperationsData}
              />
            </div>
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
