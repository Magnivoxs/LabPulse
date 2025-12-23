import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface TableCounts {
  offices: number;
  staff: number;
  contacts: number;
  financials: number;
  ops: number;
  volume: number;
  notes: number;
  alerts: number;
}

export default function Settings() {
  const [tableCounts, setTableCounts] = useState<TableCounts | null>(null);
  const [dbPath, setDbPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadSanityCheck = async () => {
    setLoading(true);
    setError('');
    try {
      const counts = await invoke<TableCounts>('get_db_table_counts');
      const path = await invoke<string>('get_db_path');
      setTableCounts(counts);
      setDbPath(path);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load sanity check:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSanityCheck();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Database Sanity Check Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Database Sanity Check</h2>
          <button
            onClick={loadSanityCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Database Path */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Database Location</h3>
          <code className="block bg-gray-100 p-3 rounded text-sm break-all">
            {dbPath || 'Loading...'}
          </code>
        </div>

        {/* Table Counts */}
        {tableCounts && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Table Row Counts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Offices" value={tableCounts.offices} />
              <StatCard label="Staff" value={tableCounts.staff} />
              <StatCard label="Contacts" value={tableCounts.contacts} />
              <StatCard label="Financials" value={tableCounts.financials} />
              <StatCard label="Operations" value={tableCounts.ops} />
              <StatCard label="Volume" value={tableCounts.volume} />
              <StatCard label="Notes" value={tableCounts.notes} />
              <StatCard label="Alerts" value={tableCounts.alerts} />
            </div>
          </div>
        )}
      </div>

      {/* Future Settings Sections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Alert Thresholds</h2>
        <p className="text-gray-600">Coming in Phase 3...</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
