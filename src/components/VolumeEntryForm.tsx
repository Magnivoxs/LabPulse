import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { VolumeData } from '../types/DataEntry';

interface VolumeEntryFormProps {
  officeId: number | null;
  month: number;
  year: number;
  onDataLoaded?: (hasData: boolean) => void;
}

export default function VolumeEntryForm({ 
  officeId, 
  month, 
  year,
  onDataLoaded 
}: VolumeEntryFormProps) {
  const [formData, setFormData] = useState<Omit<VolumeData, 'id' | 'office_id' | 'year' | 'month'>>({
    backlog_in_lab: 0,
    backlog_in_clinic: 0,
    total_weekly_units: 0,
  });

  const [previousMonthData, setPreviousMonthData] = useState<VolumeData | null>(null);
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
      const data = await invoke<VolumeData | null>('get_volume_data', {
        officeId,
        year,
        month,
      });

      if (data) {
        setFormData({
          backlog_in_lab: data.backlog_in_lab,
          backlog_in_clinic: data.backlog_in_clinic,
          total_weekly_units: data.total_weekly_units,
        });
        onDataLoaded?.(true);
      } else {
        setFormData({
          backlog_in_lab: 0,
          backlog_in_clinic: 0,
          total_weekly_units: 0,
        });
        onDataLoaded?.(false);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load volume data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousMonth = async () => {
    if (!officeId) return;
    
    try {
      const data = await invoke<VolumeData | null>('get_previous_month_volume', {
        officeId,
        year,
        month,
      });
      setPreviousMonthData(data);
    } catch (err) {
      console.error('Failed to load previous month volume data:', err);
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
      await invoke('save_volume_data', {
        officeId,
        year,
        month,
        backlogInLab: Math.round(formData.backlog_in_lab),
        backlogInClinic: Math.round(formData.backlog_in_clinic),
        totalWeeklyUnits: Math.round(formData.total_weekly_units),
      });

      setSaveStatus('success');
      setHasUnsavedChanges(false);
      onDataLoaded?.(true);

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save volume data:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const copyFromPreviousMonth = () => {
    if (previousMonthData) {
      setFormData({
        backlog_in_lab: previousMonthData.backlog_in_lab,
        backlog_in_clinic: previousMonthData.backlog_in_clinic,
        total_weekly_units: previousMonthData.total_weekly_units,
      });
      setHasUnsavedChanges(true);
    }
  };

  // Calculate total backlog
  const totalBacklog = formData.backlog_in_lab + formData.backlog_in_clinic;

  if (!officeId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please select an office to enter volume data
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading volume data...
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

      {/* Volume Fields */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Volume Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Backlog in Lab */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backlog in Lab
            </label>
            <input
              type="number"
              value={formData.backlog_in_lab}
              onChange={(e) => handleInputChange('backlog_in_lab', e.target.value)}
              onFocus={handleFocus}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              step="1"
              min="0"
            />
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: {previousMonthData.backlog_in_lab}
              </div>
            )}
          </div>

          {/* Backlog in Clinic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backlog in Clinic
            </label>
            <input
              type="number"
              value={formData.backlog_in_clinic}
              onChange={(e) => handleInputChange('backlog_in_clinic', e.target.value)}
              onFocus={handleFocus}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              step="1"
              min="0"
            />
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: {previousMonthData.backlog_in_clinic}
              </div>
            )}
          </div>

          {/* Total Weekly Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Weekly Units
            </label>
            <input
              type="number"
              value={formData.total_weekly_units}
              onChange={(e) => handleInputChange('total_weekly_units', e.target.value)}
              onFocus={handleFocus}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              step="1"
              min="0"
            />
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: {previousMonthData.total_weekly_units}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Backlog (Lab + Clinic)</div>
            <div className="text-xl font-bold text-gray-900">
              {totalBacklog}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Total Weekly Units</div>
            <div className="text-xl font-bold text-gray-900">
              {formData.total_weekly_units}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

