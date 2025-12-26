import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FinancialData } from '../types/DataEntry';

interface FinancialEntryFormProps {
  officeId: number | null;
  month: number;
  year: number;
  onDataLoaded?: (hasData: boolean) => void;
}

export default function FinancialEntryForm({ 
  officeId, 
  month, 
  year,
  onDataLoaded 
}: FinancialEntryFormProps) {
  const [formData, setFormData] = useState<Omit<FinancialData, 'id' | 'office_id' | 'year' | 'month' | 'outside_lab_spend'>>({
    revenue: 0,
    lab_exp_no_outside: 0,
    lab_exp_with_outside: 0,
    teeth_supplies: 0,
    lab_supplies: 0,
    lab_hub: 0,
    lss_expense: 0,
    personnel_exp: 0,
    overtime_exp: 0,
    bonus_exp: 0,
  });

  const [previousMonthData, setPreviousMonthData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper to select all text on focus for easy replacement
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // Helper to format number with commas for display
  const formatNumberForDisplay = (value: number): string => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

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
      const data = await invoke<FinancialData | null>('get_financial_data', {
        officeId,
        year,
        month,
      });

      if (data) {
        setFormData({
          revenue: data.revenue,
          lab_exp_no_outside: data.lab_exp_no_outside,
          lab_exp_with_outside: data.lab_exp_with_outside,
          teeth_supplies: data.teeth_supplies,
          lab_supplies: data.lab_supplies,
          lab_hub: data.lab_hub,
          lss_expense: data.lss_expense,
          personnel_exp: data.personnel_exp,
          overtime_exp: data.overtime_exp,
          bonus_exp: data.bonus_exp,
        });
        onDataLoaded?.(true);
      } else {
        // Reset form for new entry
        setFormData({
          revenue: 0,
          lab_exp_no_outside: 0,
          lab_exp_with_outside: 0,
          teeth_supplies: 0,
          lab_supplies: 0,
          lab_hub: 0,
          lss_expense: 0,
          personnel_exp: 0,
          overtime_exp: 0,
          bonus_exp: 0,
        });
        onDataLoaded?.(false);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousMonth = async () => {
    if (!officeId) return;
    
    try {
      const data = await invoke<FinancialData | null>('get_previous_month_financial', {
        officeId,
        year,
        month,
      });
      setPreviousMonthData(data);
    } catch (err) {
      console.error('Failed to load previous month data:', err);
      setPreviousMonthData(null);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    // Remove commas before parsing
    const cleanValue = value.replace(/,/g, '');
    // Allow empty string to become 0, but preserve actual 0 values
    const numValue = cleanValue === '' ? 0 : parseFloat(cleanValue);
    // Only update if it's a valid number or 0
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [field]: numValue }));
      setHasUnsavedChanges(true);
      setSaveStatus('idle');
    }
  };

  const handleSave = async () => {
    if (!officeId) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      await invoke('save_financial_data', {
        officeId: officeId,
        year: year,
        month: month,
        revenue: formData.revenue,
        labExpNoOutside: formData.lab_exp_no_outside,
        labExpWithOutside: formData.lab_exp_with_outside,
        outsideLabSpend: calculatedOutsideLabSpend,
        teethSupplies: formData.teeth_supplies,
        labSupplies: formData.lab_supplies,
        labHub: formData.lab_hub,
        lssExpense: formData.lss_expense,
        personnelExp: formData.personnel_exp,
        overtimeExp: formData.overtime_exp,
        bonusExp: formData.bonus_exp,
      });

      setSaveStatus('success');
      setHasUnsavedChanges(false);
      onDataLoaded?.(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save financial data:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const copyFromPreviousMonth = () => {
    if (previousMonthData) {
      setFormData({
        revenue: previousMonthData.revenue,
        lab_exp_no_outside: previousMonthData.lab_exp_no_outside,
        lab_exp_with_outside: previousMonthData.lab_exp_with_outside,
        teeth_supplies: previousMonthData.teeth_supplies,
        lab_supplies: previousMonthData.lab_supplies,
        lab_hub: previousMonthData.lab_hub,
        lss_expense: previousMonthData.lss_expense,
        personnel_exp: previousMonthData.personnel_exp,
        overtime_exp: previousMonthData.overtime_exp,
        bonus_exp: previousMonthData.bonus_exp,
      });
      setHasUnsavedChanges(true);
    }
  };

  // Auto-calculate outside lab spend
  const calculatedOutsideLabSpend = formData.lab_exp_with_outside - formData.lab_exp_no_outside;

  // Calculate metrics
  const totalLabExpensesPercent = formData.revenue > 0 
    ? (formData.lab_exp_with_outside / formData.revenue) * 100 
    : 0;

  const personnelPercent = formData.revenue > 0 
    ? (formData.personnel_exp / formData.revenue) * 100 
    : 0;

  const outsideLabPercent = formData.lab_exp_with_outside > 0 
    ? (calculatedOutsideLabSpend / formData.lab_exp_with_outside) * 100 
    : 0;

  const overtimePercent = formData.revenue > 0 
    ? (formData.overtime_exp / formData.revenue) * 100 
    : 0;

  if (!officeId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please select an office to enter financial data
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading financial data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calculated Metrics - MOVED TO TOP */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Calculated Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Lab Exp % of Revenue</div>
            <div className="text-xl font-bold text-gray-900">
              {totalLabExpensesPercent.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">Personnel % of Revenue</div>
            <div className="text-xl font-bold text-gray-900">
              {personnelPercent.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">Outside Lab Spend %</div>
            <div className="text-xl font-bold text-gray-900">
              {outsideLabPercent.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">Overtime % of Revenue</div>
            <div className="text-xl font-bold text-gray-900">
              {overtimePercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

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

      {/* Revenue Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Revenue
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.revenue)}
                onChange={(e) => handleInputChange('revenue', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
          {previousMonthData && (
            <div className="text-sm text-gray-600 flex items-end pb-2">
              Previous: ${previousMonthData.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
      </div>

      {/* Lab Expenses Section - 7 FIELDS */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Lab Expenses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lab Expenses (without outside) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Expenses (without outside)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.lab_exp_no_outside)}
                onChange={(e) => handleInputChange('lab_exp_no_outside', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.lab_exp_no_outside.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Lab Expenses (with outside) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Expenses (with outside)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.lab_exp_with_outside)}
                onChange={(e) => handleInputChange('lab_exp_with_outside', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.lab_exp_with_outside.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Outside Lab Spend */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outside Lab Spend (auto-calculated)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(calculatedOutsideLabSpend)}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${(previousMonthData.lab_exp_with_outside - previousMonthData.lab_exp_no_outside).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Lab Supplies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Supplies
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.lab_supplies)}
                onChange={(e) => handleInputChange('lab_supplies', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.lab_supplies.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Tooth Supplies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tooth Supplies
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.teeth_supplies)}
                onChange={(e) => handleInputChange('teeth_supplies', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.teeth_supplies.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Lab Hub - NEW FIELD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Hub
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.lab_hub)}
                onChange={(e) => handleInputChange('lab_hub', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.lab_hub.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* LSS Expense - NEW FIELD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LSS Expense
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.lss_expense)}
                onChange={(e) => handleInputChange('lss_expense', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.lss_expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personnel Section - 3 FIELDS */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Personnel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personnel Expenses (total)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.personnel_exp)}
                onChange={(e) => handleInputChange('personnel_exp', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.personnel_exp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overtime Expenses
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.overtime_exp)}
                onChange={(e) => handleInputChange('overtime_exp', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.overtime_exp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus Amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                value={formatNumberForDisplay(formData.bonus_exp)}
                onChange={(e) => handleInputChange('bonus_exp', e.target.value)}
                onFocus={handleFocus}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {previousMonthData && (
              <div className="text-xs text-gray-500 mt-1">
                Prev: ${previousMonthData.bonus_exp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

