import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { OperationsData } from '../types/DataEntry';

interface OperationsEntryFormProps {
  officeId: number | null;
  month: number;
  year: number;
  onDataLoaded?: (hasData: boolean) => void;
}

export default function OperationsEntryForm({ 
  officeId, 
  month, 
  year,
  onDataLoaded 
}: OperationsEntryFormProps) {
  const [formData, setFormData] = useState<Omit<OperationsData, 'id' | 'office_id' | 'year' | 'month'>>({
    backlog_case_count: 0,
    overtime_value: 0,
    labor_model_value: 0,
  });

  const [previousMonthData, setPreviousMonthData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load data when office/month changes
  useEffect(() => {
    if (officeId) {
      loadData();
      loadPreviousMonth();
    }
  }, [officeId, month, year]);

  const loadData = async () => {
    if (!officeId) return;
    
    setLoading(true);
    try {
      const data = await invoke<OperationsData | null>('get_operations_data', {
        officeId,
        year,
        month,
      });

      if (data) {
        setFormData({
          backlog_case_count: data.backlog_case_count,
          overtime_value: data.overtime_value,
          labor_model_value: data.labor_model_value,
        });
        onDataLoaded?.(true);
      } else {
        setFormData({
          backlog_case_count: 0,
          overtime_value: 0,
          labor_model_value: 0,
        });
        onDataLoaded?.(false);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousMonth = async () => {
    if (!officeId) return;
    
    try {
      const data = await invoke<OperationsData | null>('get_previous_month_operations', {
        officeId,
        year,
        month,
      });
      setPreviousMonthData(data);
    } catch (err) {
      console.error('Failed to load previous month operations data:', err);
      setPreviousMonthData(null);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [field]: numValue }));
      setHasUnsavedChanges(true);
      setSaveStatus('idle');
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleSave = async () => {
    if (!officeId) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      await invoke('save_operations_data', {
        officeId,
        year,
        month,
        backlogCaseCount: Math.round(formData.backlog_case_count),
        overtimeValue: formData.overtime_value,
        laborModelValue: formData.labor_model_value,
      });

      setSaveStatus('success');
      setHasUnsavedChanges(false);
      onDataLoaded?.(true);

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save operations data:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const copyFromPreviousMonth = () => {
    if (previousMonthData) {
      setFormData({
        backlog_case_count: previousMonthData.backlog_case_count,
        overtime_value: previousMonthData.overtime_value,
        labor_model_value: previousMonthData.labor_model_value,
      });
      setHasUnsavedChanges(true);
    }
  };

  if (!officeId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please select an office to enter operations data
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading operations data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {previousMonthData && (
            <button
              onClick={copyFromPreviousMonth}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Copy from Previous Month
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-yellow-600">● Unsaved changes</span>
          )}
          {saveStatus === 'success' && (
            <span className="text-sm text-green-600">✓ Saved successfully</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600">✗ Save failed</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Operations Fields */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Operations Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Backlog Case Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backlog Case Count
            </label>
            <input
              type="number"
              value={formData.backlog_case_count}
              onChange={(e) => handleInputChange('backlog_case_count', e.target.value)}
              onFocus={handleFocus}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              step="1"
              min="0"
            />
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: {previousMonthData.backlog_case_count}
              </div>
            )}
          </div>

          {/* Overtime Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overtime Value
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={formData.overtime_value}
                onChange={(e) => handleInputChange('overtime_value', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.overtime_value.toLocaleString()}
              </div>
            )}
          </div>

          {/* Labor Model Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labor Model Value
            </label>
            <input
              type="number"
              value={formData.labor_model_value}
              onChange={(e) => handleInputChange('labor_model_value', e.target.value)}
              onFocus={handleFocus}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
              step="0.1"
              min="-9"
              max="9"
            />
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: {previousMonthData.labor_model_value}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

