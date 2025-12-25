import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import MonthOfficeSelector from '../components/MonthOfficeSelector';
import FinancialEntryForm from '../components/FinancialEntryForm';

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
  const [hasFinancialData, setHasFinancialData] = useState(false);

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

      console.log(`Importing ${importType} from:`, selected);

      let result: ImportSummary;
      if (importType === 'offices') {
        result = await invoke<ImportSummary>('import_offices_file', { filePath: selected });
      } else if (importType === 'staff') {
        result = await invoke<ImportSummary>('import_staff_file', { filePath: selected });
      } else {
        result = await invoke<ImportSummary>('import_contacts_file', { filePath: selected });
      }

      console.log('Import result:', result);
      setLastImport(result);
    } catch (err) {
      console.error('Import error:', err);
      alert(`Import failed: ${err}`);
    } finally {
      setImporting('');
    }
  };

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
              {/* Office List Import */}
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

              {/* Staff Roster Import */}
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

              {/* Contacts Import */}
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

            {/* Import Summary */}
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
          hasData={hasFinancialData}
        />
      </div>

      {/* Financial Entry Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Financial Data Entry</h2>
        <FinancialEntryForm
          officeId={selectedOffice}
          month={selectedMonth}
          year={selectedYear}
          onDataLoaded={setHasFinancialData}
        />
      </div>
    </div>
  );
}
