import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface ImportSummary {
  filename: string;
  rows_processed: number;
  rows_inserted: number;
  rows_updated: number;
  warnings: string[];
}

export default function DataEntry() {
  const [importing, setImporting] = useState<string>('');
  const [lastImport, setLastImport] = useState<ImportSummary | null>(null);

  const handleImport = async (importType: 'offices' | 'staff' | 'contacts') => {
    setImporting(importType);
    setLastImport(null);

    try {
      // Use Tauri dialog plugin
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
        return; // User cancelled
      }

      console.log(`Importing ${importType} from:`, selected);

      // Call appropriate import command
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Data Entry</h1>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Import Reference Data</h2>
        <p className="text-gray-600 mb-6">
          Import office list, staff roster, and contact information from Excel files.
          This is typically done once during setup or when reference data changes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Office List Import */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Office List</h3>
            <p className="text-sm text-gray-600 mb-4">
              Import office names, addresses, DFOs, models, and standardization status.
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
              Import employee names, job titles, and hire dates for all offices.
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
              Import lab manager names and phone numbers for each office.
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

      {/* Manual Entry Section - Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Manual Data Entry</h2>
        <p className="text-gray-600">
          Manual entry forms for financial, operations, and volume data coming next...
        </p>
      </div>
    </div>
  );
}
