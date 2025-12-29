import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { VolumeData, WeeklyVolumeData } from '../types/DataEntry';

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
    lab_setups: 0,
    lab_fixed_cases: 0,
    lab_over_denture: 0,
    lab_processes: 0,
    lab_finishes: 0,
    clinic_wax_tryin: 0,
    clinic_delivery: 0,
    clinic_outside_lab: 0,
    clinic_on_hold: 0,
    immediate_units: 0,
    economy_units: 0,
    economy_plus_units: 0,
    premium_units: 0,
    ultimate_units: 0,
    repair_units: 0,
    reline_units: 0,
    partial_units: 0,
    retry_units: 0,
    remake_units: 0,
    bite_block_units: 0,
    total_weekly_units: 0,
  });

  const [previousMonthData, setPreviousMonthData] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Section visibility states
  const [showLabBreakdown, setShowLabBreakdown] = useState(false);
  const [showClinicBreakdown, setShowClinicBreakdown] = useState(false);
  const [showUnitBreakdown, setShowUnitBreakdown] = useState(false);
  
  // Weekly data state
  const [weeklyData, setWeeklyData] = useState<WeeklyVolumeData[]>([]);
  const [showWeeklyLab, setShowWeeklyLab] = useState(false);
  const [showWeeklyClinic, setShowWeeklyClinic] = useState(false);
  const [showWeeklyUnits, setShowWeeklyUnits] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  // Load data when office/month changes
  useEffect(() => {
    if (officeId) {
      loadData();
      loadPreviousMonth();
      loadWeeklyData();
    }
  }, [officeId, month, year]);

  // Auto-calculate totals
  const calculatedLabTotal = 
    formData.lab_setups +
    formData.lab_fixed_cases +
    formData.lab_over_denture +
    formData.lab_processes +
    formData.lab_finishes;

  const calculatedClinicTotal = 
    formData.clinic_wax_tryin +
    formData.clinic_delivery +
    formData.clinic_outside_lab +
    formData.clinic_on_hold;

  const calculatedWeeklyTotal = 
    formData.immediate_units +
    formData.economy_units +
    formData.economy_plus_units +
    formData.premium_units +
    formData.ultimate_units +
    formData.repair_units +
    formData.reline_units +
    formData.partial_units +
    formData.retry_units +
    formData.remake_units +
    formData.bite_block_units;

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
          lab_setups: data.lab_setups,
          lab_fixed_cases: data.lab_fixed_cases,
          lab_over_denture: data.lab_over_denture,
          lab_processes: data.lab_processes,
          lab_finishes: data.lab_finishes,
          clinic_wax_tryin: data.clinic_wax_tryin,
          clinic_delivery: data.clinic_delivery,
          clinic_outside_lab: data.clinic_outside_lab,
          clinic_on_hold: data.clinic_on_hold,
          immediate_units: data.immediate_units,
          economy_units: data.economy_units,
          economy_plus_units: data.economy_plus_units,
          premium_units: data.premium_units,
          ultimate_units: data.ultimate_units,
          repair_units: data.repair_units,
          reline_units: data.reline_units,
          partial_units: data.partial_units,
          retry_units: data.retry_units,
          remake_units: data.remake_units,
          bite_block_units: data.bite_block_units,
          total_weekly_units: data.total_weekly_units,
        });
        onDataLoaded?.(true);
      } else {
        // Reset to zeros
        setFormData({
          backlog_in_lab: 0,
          backlog_in_clinic: 0,
          lab_setups: 0,
          lab_fixed_cases: 0,
          lab_over_denture: 0,
          lab_processes: 0,
          lab_finishes: 0,
          clinic_wax_tryin: 0,
          clinic_delivery: 0,
          clinic_outside_lab: 0,
          clinic_on_hold: 0,
          immediate_units: 0,
          economy_units: 0,
          economy_plus_units: 0,
          premium_units: 0,
          ultimate_units: 0,
          repair_units: 0,
          reline_units: 0,
          partial_units: 0,
          retry_units: 0,
          remake_units: 0,
          bite_block_units: 0,
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

  const loadWeeklyData = async () => {
    if (!officeId) return;
    
    setLoadingWeekly(true);
    try {
      const data = await invoke<WeeklyVolumeData[]>('get_weekly_volume_records', {
        officeId,
        year,
        month,
      });
      setWeeklyData(data);
    } catch (err) {
      console.error('Failed to load weekly volume data:', err);
      setWeeklyData([]);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
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
        backlogInLab: calculatedLabTotal,
        backlogInClinic: calculatedClinicTotal,
        labSetups: formData.lab_setups,
        labFixedCases: formData.lab_fixed_cases,
        labOverDenture: formData.lab_over_denture,
        labProcesses: formData.lab_processes,
        labFinishes: formData.lab_finishes,
        clinicWaxTryin: formData.clinic_wax_tryin,
        clinicDelivery: formData.clinic_delivery,
        clinicOutsideLab: formData.clinic_outside_lab,
        clinicOnHold: formData.clinic_on_hold,
        immediateUnits: formData.immediate_units,
        economyUnits: formData.economy_units,
        economyPlusUnits: formData.economy_plus_units,
        premiumUnits: formData.premium_units,
        ultimateUnits: formData.ultimate_units,
        repairUnits: formData.repair_units,
        relineUnits: formData.reline_units,
        partialUnits: formData.partial_units,
        retryUnits: formData.retry_units,
        remakeUnits: formData.remake_units,
        biteBlockUnits: formData.bite_block_units,
        totalWeeklyUnits: calculatedWeeklyTotal,
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
        lab_setups: previousMonthData.lab_setups,
        lab_fixed_cases: previousMonthData.lab_fixed_cases,
        lab_over_denture: previousMonthData.lab_over_denture,
        lab_processes: previousMonthData.lab_processes,
        lab_finishes: previousMonthData.lab_finishes,
        clinic_wax_tryin: previousMonthData.clinic_wax_tryin,
        clinic_delivery: previousMonthData.clinic_delivery,
        clinic_outside_lab: previousMonthData.clinic_outside_lab,
        clinic_on_hold: previousMonthData.clinic_on_hold,
        immediate_units: previousMonthData.immediate_units,
        economy_units: previousMonthData.economy_units,
        economy_plus_units: previousMonthData.economy_plus_units,
        premium_units: previousMonthData.premium_units,
        ultimate_units: previousMonthData.ultimate_units,
        repair_units: previousMonthData.repair_units,
        reline_units: previousMonthData.reline_units,
        partial_units: previousMonthData.partial_units,
        retry_units: previousMonthData.retry_units,
        remake_units: previousMonthData.remake_units,
        bite_block_units: previousMonthData.bite_block_units,
        total_weekly_units: previousMonthData.total_weekly_units,
      });
      setHasUnsavedChanges(true);
    }
  };

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

      {/* Overview - Always Visible */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
        <h3 className="text-xl font-bold mb-4 text-blue-900">Volume Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Backlog in Lab */}
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 mb-1">Backlog in Lab</div>
            <div className="text-4xl font-bold text-blue-600">{calculatedLabTotal}</div>
          </div>

          {/* Backlog in Clinic */}
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 mb-1">Backlog in Clinic</div>
            <div className="text-4xl font-bold text-green-600">{calculatedClinicTotal}</div>
          </div>

          {/* Total Weekly Units */}
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Weekly Units</div>
            <div className="text-4xl font-bold text-purple-600">{calculatedWeeklyTotal}</div>
          </div>
        </div>
      </div>

      {/* Section 1: Backlog in Lab Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Backlog in Lab Details</h3>
          <button
            onClick={() => setShowLabBreakdown(!showLabBreakdown)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            {showLabBreakdown ? '− Hide Details' : '+ Show Details'}
          </button>
        </div>

        {showLabBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Set-ups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set-ups
              </label>
              <input
                type="number"
                value={formData.lab_setups}
                onChange={(e) => handleInputChange('lab_setups', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.lab_setups}
                </div>
              )}
            </div>

            {/* Fixed Cases */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Cases
              </label>
              <input
                type="number"
                value={formData.lab_fixed_cases}
                onChange={(e) => handleInputChange('lab_fixed_cases', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.lab_fixed_cases}
                </div>
              )}
            </div>

            {/* Over-Denture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Over-Denture
              </label>
              <input
                type="number"
                value={formData.lab_over_denture}
                onChange={(e) => handleInputChange('lab_over_denture', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.lab_over_denture}
                </div>
              )}
            </div>

            {/* Processes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Processes
              </label>
              <input
                type="number"
                value={formData.lab_processes}
                onChange={(e) => handleInputChange('lab_processes', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.lab_processes}
                </div>
              )}
            </div>

            {/* Finishes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finishes
              </label>
              <input
                type="number"
                value={formData.lab_finishes}
                onChange={(e) => handleInputChange('lab_finishes', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.lab_finishes}
                </div>
              )}
            </div>
            
            {/* Weekly Breakdown Table - Lab */}
            {weeklyData.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setShowWeeklyLab(!showWeeklyLab)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium mb-3"
                >
                  {showWeeklyLab ? '− Hide Weekly Breakdown' : '+ View Weekly Breakdown'}
                </button>
                
                {showWeeklyLab && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Week</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Set-ups</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Fixed</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Over-Denture</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Processes</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Finishes</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b bg-blue-100">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyData.map((week) => {
                          const weekTotal = week.lab_setups + week.lab_fixed_cases + week.lab_over_denture + 
                                           week.lab_processes + week.lab_finishes;
                          return (
                            <tr key={week.week_number} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border-b font-medium">Week {week.week_number}</td>
                              <td className="px-3 py-2 border-b text-right">{week.lab_setups}</td>
                              <td className="px-3 py-2 border-b text-right">{week.lab_fixed_cases}</td>
                              <td className="px-3 py-2 border-b text-right">{week.lab_over_denture}</td>
                              <td className="px-3 py-2 border-b text-right">{week.lab_processes}</td>
                              <td className="px-3 py-2 border-b text-right">{week.lab_finishes}</td>
                              <td className="px-3 py-2 border-b text-right font-bold bg-blue-50">{weekTotal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Backlog in Clinic Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Backlog in Clinic Details</h3>
          <button
            onClick={() => setShowClinicBreakdown(!showClinicBreakdown)}
            className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm font-medium"
          >
            {showClinicBreakdown ? '− Hide Details' : '+ Show Details'}
          </button>
        </div>

        {showClinicBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Wax Try-in */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wax Try-in Appointments
              </label>
              <input
                type="number"
                value={formData.clinic_wax_tryin}
                onChange={(e) => handleInputChange('clinic_wax_tryin', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.clinic_wax_tryin}
                </div>
              )}
            </div>

            {/* Delivery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Appointments
              </label>
              <input
                type="number"
                value={formData.clinic_delivery}
                onChange={(e) => handleInputChange('clinic_delivery', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.clinic_delivery}
                </div>
              )}
            </div>

            {/* Outside Lab */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outside Lab Cases
              </label>
              <input
                type="number"
                value={formData.clinic_outside_lab}
                onChange={(e) => handleInputChange('clinic_outside_lab', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.clinic_outside_lab}
                </div>
              )}
            </div>

            {/* On-Hold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cases On-Hold
              </label>
              <input
                type="number"
                value={formData.clinic_on_hold}
                onChange={(e) => handleInputChange('clinic_on_hold', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.clinic_on_hold}
                </div>
              )}
            </div>
            
            {/* Weekly Breakdown Table - Clinic */}
            {weeklyData.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setShowWeeklyClinic(!showWeeklyClinic)}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors text-sm font-medium mb-3"
                >
                  {showWeeklyClinic ? '− Hide Weekly Breakdown' : '+ View Weekly Breakdown'}
                </button>
                
                {showWeeklyClinic && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Week</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Wax Try-in</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Delivery</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Outside Lab</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">On-Hold</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b bg-green-100">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyData.map((week) => {
                          const weekTotal = week.clinic_wax_tryin + week.clinic_delivery + 
                                           week.clinic_outside_lab + week.clinic_on_hold;
                          return (
                            <tr key={week.week_number} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border-b font-medium">Week {week.week_number}</td>
                              <td className="px-3 py-2 border-b text-right">{week.clinic_wax_tryin}</td>
                              <td className="px-3 py-2 border-b text-right">{week.clinic_delivery}</td>
                              <td className="px-3 py-2 border-b text-right">{week.clinic_outside_lab}</td>
                              <td className="px-3 py-2 border-b text-right">{week.clinic_on_hold}</td>
                              <td className="px-3 py-2 border-b text-right font-bold bg-green-50">{weekTotal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Weekly Unit Report Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Weekly Unit Report Details</h3>
          <button
            onClick={() => setShowUnitBreakdown(!showUnitBreakdown)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            {showUnitBreakdown ? '− Hide Details' : '+ Show Details'}
          </button>
        </div>

        {showUnitBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Immediate Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Immediate Units
              </label>
              <input
                type="number"
                value={formData.immediate_units}
                onChange={(e) => handleInputChange('immediate_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.immediate_units}
                </div>
              )}
            </div>

            {/* Economy Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Economy Units
              </label>
              <input
                type="number"
                value={formData.economy_units}
                onChange={(e) => handleInputChange('economy_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.economy_units}
                </div>
              )}
            </div>

            {/* Economy Plus Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Economy Plus Units
              </label>
              <input
                type="number"
                value={formData.economy_plus_units}
                onChange={(e) => handleInputChange('economy_plus_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.economy_plus_units}
                </div>
              )}
            </div>

            {/* Premium Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Premium Units
              </label>
              <input
                type="number"
                value={formData.premium_units}
                onChange={(e) => handleInputChange('premium_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.premium_units}
                </div>
              )}
            </div>

            {/* Ultimate Fit Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ultimate Fit Units
              </label>
              <input
                type="number"
                value={formData.ultimate_units}
                onChange={(e) => handleInputChange('ultimate_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.ultimate_units}
                </div>
              )}
            </div>

            {/* Repair Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repair Units
              </label>
              <input
                type="number"
                value={formData.repair_units}
                onChange={(e) => handleInputChange('repair_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.repair_units}
                </div>
              )}
            </div>

            {/* Reline Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reline Units
              </label>
              <input
                type="number"
                value={formData.reline_units}
                onChange={(e) => handleInputChange('reline_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.reline_units}
                </div>
              )}
            </div>

            {/* Partial Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partial Units
              </label>
              <input
                type="number"
                value={formData.partial_units}
                onChange={(e) => handleInputChange('partial_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.partial_units}
                </div>
              )}
            </div>

            {/* Retry Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retry Units
              </label>
              <input
                type="number"
                value={formData.retry_units}
                onChange={(e) => handleInputChange('retry_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.retry_units}
                </div>
              )}
            </div>

            {/* Remake Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remake Units
              </label>
              <input
                type="number"
                value={formData.remake_units}
                onChange={(e) => handleInputChange('remake_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.remake_units}
                </div>
              )}
            </div>

            {/* Bite Block Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bite Block Units
              </label>
              <input
                type="number"
                value={formData.bite_block_units}
                onChange={(e) => handleInputChange('bite_block_units', e.target.value)}
                onFocus={handleFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="1"
                min="0"
              />
              {previousMonthData && (
                <div className="text-xs text-gray-500 mt-1">
                  Prev: {previousMonthData.bite_block_units}
                </div>
              )}
            </div>
            
            {/* Weekly Breakdown Table - Units */}
            {weeklyData.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setShowWeeklyUnits(!showWeeklyUnits)}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors text-sm font-medium mb-3"
                >
                  {showWeeklyUnits ? '− Hide Weekly Breakdown' : '+ View Weekly Breakdown'}
                </button>
                
                {showWeeklyUnits && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Week</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Immed.</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Econ.</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Econ+</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Prem.</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Ult.</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Repair</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Reline</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Partial</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Retry</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Remake</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">Bite</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700 border-b bg-purple-100">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyData.map((week) => {
                          const weekTotal = week.immediate_units + week.economy_units + week.economy_plus_units +
                                           week.premium_units + week.ultimate_units + week.repair_units +
                                           week.reline_units + week.partial_units + week.retry_units +
                                           week.remake_units + week.bite_block_units;
                          return (
                            <tr key={week.week_number} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border-b font-medium">Week {week.week_number}</td>
                              <td className="px-3 py-2 border-b text-right">{week.immediate_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.economy_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.economy_plus_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.premium_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.ultimate_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.repair_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.reline_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.partial_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.retry_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.remake_units}</td>
                              <td className="px-3 py-2 border-b text-right">{week.bite_block_units}</td>
                              <td className="px-3 py-2 border-b text-right font-bold bg-purple-50">{weekTotal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
