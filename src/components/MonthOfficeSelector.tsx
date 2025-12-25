import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Office, MonthYear } from '../types/DataEntry';

interface MonthOfficeSelectorProps {
  selectedOffice: number | null;
  selectedMonth: number;
  selectedYear: number;
  onOfficeChange: (officeId: number) => void;
  onMonthChange: (month: number, year: number) => void;
  hasData?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthOfficeSelector({
  selectedOffice,
  selectedMonth,
  selectedYear,
  onOfficeChange,
  onMonthChange,
  hasData = false
}: MonthOfficeSelectorProps) {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffices();
  }, []);

  const loadOffices = async () => {
    try {
      const officeList = await invoke<Office[]>('get_offices');
      setOffices(officeList);
      
      // Auto-select first office if none selected
      if (!selectedOffice && officeList.length > 0) {
        onOfficeChange(officeList[0].office_id);
      }
    } catch (err) {
      console.error('Failed to load offices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMonthChange(parseInt(e.target.value), selectedYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value);
    if (!isNaN(year) && year >= 2020 && year <= 2050) {
      onMonthChange(selectedMonth, year);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading offices...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Office Selector */}
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Office
          </label>
          <select
            value={selectedOffice || ''}
            onChange={(e) => onOfficeChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an office...</option>
            {offices.map((office) => (
              <option key={office.office_id} value={office.office_id}>
                {office.office_id} - {office.office_name}
              </option>
            ))}
          </select>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Previous Month"
          >
            ←
          </button>

          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={handleMonthSelect}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={selectedYear}
              onChange={handleYearChange}
              min="2020"
              max="2050"
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Next Month"
          >
            →
          </button>
        </div>

        {/* Data Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          {hasData ? (
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              Data exists
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-400">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              No data
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

