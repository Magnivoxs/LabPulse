import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import * as XLSX from 'xlsx';

interface Office {
  office_id: number;
  office_name: string;
  address: string;
  phone: string | null;
  managing_dentist: string | null;
  dfo: string;
  model: string;
  standardization_status: string | null;
}

interface Staff {
  name: string;
  position: string;
  hire_date: string;
}

interface LabManagerContact {
  name: string;
  email: string;
  phone: string;
}

interface OfficeDetails {
  office: Office;
  staff: Staff[];
  lab_manager: LabManagerContact | null;
}

export default function Directory() {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<Office[]>([]);
  const [filteredOffices, setFilteredOffices] = useState<Office[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dfoFilter, setDfoFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<number | null>(null);
  const [officeDetails, setOfficeDetails] = useState<OfficeDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [showAddOfficeModal, setShowAddOfficeModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Load all offices
  const loadOffices = async () => {
    setLoading(true);
    try {
      const data = await invoke<Office[]>('get_directory_offices');
      setOffices(data);
      setFilteredOffices(data);
    } catch (err) {
      console.error('Failed to load offices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load details for specific office
  const loadOfficeDetails = async (officeId: number, event?: React.MouseEvent) => {
    // Prevent any default behavior or navigation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Loading office details for:', officeId);
    setDetailsLoading(true);
    setSelectedOffice(officeId);
    try {
      const data = await invoke<OfficeDetails>('get_directory_office_details', { officeId });
      setOfficeDetails(data);
      console.log('Office details loaded successfully');
    } catch (err) {
      console.error('Failed to load office details:', err);
      setOfficeDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filter offices based on search and DFO
  useEffect(() => {
    let filtered = offices;

    // Filter by DFO
    if (dfoFilter !== 'all') {
      filtered = filtered.filter(office => office.dfo === dfoFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(office =>
        office.office_name.toLowerCase().includes(query) ||
        office.office_id.toString().includes(query) ||
        office.address?.toLowerCase().includes(query)
      );
    }

    setFilteredOffices(filtered);
  }, [searchQuery, dfoFilter, offices]);

  useEffect(() => {
    loadOffices();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  // Handle office removal
  const handleRemoveOffice = async () => {
    if (!selectedOffice || !officeDetails) return;
    
    setRemoving(true);
    setRemoveError(null);
    
    try {
      const result = await invoke<string>('remove_office', {
        officeId: selectedOffice,
      });
      
      // Success
      setRemoveSuccess(true);
      setShowRemoveConfirm(false);
      setSelectedOffice(null);
      setOfficeDetails(null);
      
      // Reload office list
      await loadOffices();
      
      // Show success message
      setTimeout(() => {
        setRemoveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to remove office:', err);
      setRemoveError(err as string || 'Failed to remove office');
      setTimeout(() => {
        setRemoveError(null);
      }, 5000);
    } finally {
      setRemoving(false);
    }
  };

  // Parse address into components (simple parsing)
  const parseAddress = (address: string | null | undefined) => {
    if (!address) return { full: '', city: '', state: '', zip: '' };
    
    // Try to parse common address formats
    // Format: "123 Street, City, ST 12345" or "123 Street, City, ST"
    const parts = address.split(',').map(p => p.trim());
    const full = address;
    
    if (parts.length >= 2) {
      const city = parts[parts.length - 2] || '';
      const stateZip = parts[parts.length - 1] || '';
      const stateZipMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/);
      
      if (stateZipMatch) {
        return {
          full,
          city,
          state: stateZipMatch[1] || '',
          zip: stateZipMatch[2] || '',
        };
      }
    }
    
    return { full, city: '', state: '', zip: '' };
  };

  // Get status (Active/Inactive)
  const getStatus = (standardizationStatus: string | null | undefined): string => {
    if (!standardizationStatus) return 'Active';
    return standardizationStatus.toLowerCase().includes('inactive') ? 'Inactive' : 'Active';
  };

  // Navigate to Data Entry page
  const handleEditData = () => {
    if (!selectedOffice) return;
    
    const now = new Date();
    navigate('/data-entry', {
      state: {
        officeId: selectedOffice,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    });
  };

  // Generate and download template
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Office_Info
    const officeInfoData = [
      ['Office ID', 'Office Name', 'Address', 'City', 'State', 'ZIP', 'Phone', 'Model', 'DFO', 'Managing Dentist', 'Standardization Status'],
      ['123', 'Example Office', '123 Main St', 'City Name', 'ST', '12345', '555-1234', 'PLLC', 'Candi Abt', 'Dr. Smith', 'Active'],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(officeInfoData);
    ws1['!cols'] = [
      { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 5 }, { wch: 10 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Office_Info');
    
    // Sheet 2: Lab_Manager_Contact
    const labManagerData = [
      ['Name', 'Phone', 'Mobile', 'Role'],
      ['John Doe', '555-5678', '555-9999', 'Lab Manager'],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(labManagerData);
    ws2['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Lab_Manager_Contact');
    
    // Sheet 3: Monthly_Financials (optional)
    const financialsData = [
      ['Year', 'Month', 'Revenue', 'Lab Expense (No Outside)', 'Lab Expense (With Outside)', 'Outside Lab Spend', 'Teeth Supplies', 'Lab Supplies', 'Personnel Expense', 'Overtime Expense', 'Bonus Expense'],
      ['2024', '1', '100000', '25000', '30000', '5000', '5000', '3000', '20000', '2000', '1000'],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(financialsData);
    ws3['!cols'] = Array(11).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(wb, ws3, 'Monthly_Financials');
    
    // Sheet 4: Monthly_Operations (optional)
    const operationsData = [
      ['Year', 'Month', 'Backlog Case Count', 'Overtime Value', 'Labor Model Value'],
      ['2024', '1', '50', '2000', '15000'],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(operationsData);
    ws4['!cols'] = Array(5).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(wb, ws4, 'Monthly_Operations');
    
    // Sheet 5: Instructions
    const instructionsData = [
      ['LabPulse Office Import Template - Instructions'],
      [''],
      ['Sheet 1: Office_Info (REQUIRED)'],
      ['- Office ID: Unique numeric identifier (required)'],
      ['- Office Name: Full name of the office (required)'],
      ['- Address: Street address (required)'],
      ['- City: City name (required)'],
      ['- State: Two-letter state code (required)'],
      ['- ZIP: ZIP code (required)'],
      ['- Phone: Office phone number (optional)'],
      ['- Model: Must be "PO" or "PLLC" (required)'],
      ['- DFO: Director of Field Operations name (required)'],
      ['- Managing Dentist: Name of managing dentist (optional)'],
      ['- Standardization Status: "Active" or "Inactive" (required)'],
      [''],
      ['Sheet 2: Lab_Manager_Contact (REQUIRED)'],
      ['- Name: Lab manager full name (required)'],
      ['- Phone: Phone number (optional)'],
      ['- Mobile: Mobile number (optional)'],
      ['- Role: Default is "Lab Manager"'],
      [''],
      ['Sheet 3: Monthly_Financials (OPTIONAL)'],
      ['- Use this sheet to import historical financial data'],
      ['- Year: 4-digit year (e.g., 2024)'],
      ['- Month: 1-12'],
      ['- All financial values are optional'],
      [''],
      ['Sheet 4: Monthly_Operations (OPTIONAL)'],
      ['- Use this sheet to import historical operations data'],
      ['- Year: 4-digit year (e.g., 2024)'],
      ['- Month: 1-12'],
      ['- All operations values are optional'],
      [''],
      ['IMPORTANT NOTES:'],
      ['- Delete the example rows (row 2) before filling in your data'],
      ['- Office ID must be unique and not already exist in the system'],
      ['- All required fields must be filled in'],
      ['- Model must be exactly "PO" or "PLLC"'],
      ['- Dates must be in valid format (YYYY for year, 1-12 for month)'],
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(instructionsData);
    ws5['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Instructions');
    
    XLSX.writeFile(wb, 'LabPulse_Office_Import_Template.xlsx');
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setImportError(null);
      } else {
        setImportError('Please select an Excel file (.xlsx or .xls)');
        setSelectedFile(null);
      }
    }
  };

  // Handle file drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setImportError(null);
      } else {
        setImportError('Please select an Excel file (.xlsx or .xls)');
        setSelectedFile(null);
      }
    }
  };

  // Parse and import office from Excel file
  const handleImport = async () => {
    if (!selectedFile) return;
    
    setImporting(true);
    setImportError(null);
    setImportSuccess(false);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Parse Office_Info sheet
      const officeInfoSheet = workbook.Sheets['Office_Info'];
      if (!officeInfoSheet) {
        throw new Error('Office_Info sheet not found');
      }
      
      const officeInfoData = XLSX.utils.sheet_to_json(officeInfoSheet);
      if (!officeInfoData || officeInfoData.length === 0) {
        throw new Error('Office_Info sheet is empty');
      }
      
      const officeRow = officeInfoData[0] as any;
      
      // Validate required fields
      if (!officeRow['Office ID']) throw new Error('Office ID is required');
      if (!officeRow['Office Name']) throw new Error('Office Name is required');
      if (!officeRow['Address']) throw new Error('Address is required');
      if (!officeRow['City']) throw new Error('City is required');
      if (!officeRow['State']) throw new Error('State is required');
      if (!officeRow['ZIP']) throw new Error('ZIP is required');
      if (!officeRow['Model']) throw new Error('Model is required');
      if (!officeRow['DFO']) throw new Error('DFO is required');
      if (!officeRow['Standardization Status']) throw new Error('Standardization Status is required');
      
      // Build office data object
      const officeData: any = {
        office_id: parseInt(officeRow['Office ID']),
        office_name: officeRow['Office Name'],
        address: officeRow['Address'],
        city: officeRow['City'],
        state: officeRow['State'],
        zip: officeRow['ZIP'],
        phone: officeRow['Phone'] || null,
        model: officeRow['Model'],
        dfo: officeRow['DFO'],
        managing_dentist: officeRow['Managing Dentist'] || null,
        standardization_status: officeRow['Standardization Status'],
      };
      
      // Parse Lab_Manager_Contact sheet
      const labManagerSheet = workbook.Sheets['Lab_Manager_Contact'];
      if (labManagerSheet) {
        const labManagerData = XLSX.utils.sheet_to_json(labManagerSheet);
        if (labManagerData && labManagerData.length > 0) {
          const labManagerRow = labManagerData[0] as any;
          if (!labManagerRow['Name']) {
            throw new Error('Lab Manager Name is required');
          }
          officeData.lab_manager = {
            name: labManagerRow['Name'],
            phone: labManagerRow['Phone'] || null,
            mobile: labManagerRow['Mobile'] || null,
            role: labManagerRow['Role'] || 'Lab Manager',
          };
        }
      } else {
        throw new Error('Lab_Manager_Contact sheet not found');
      }
      
      // Parse Monthly_Financials sheet (optional)
      const financialsSheet = workbook.Sheets['Monthly_Financials'];
      if (financialsSheet) {
        const financialsData = XLSX.utils.sheet_to_json(financialsSheet);
        if (financialsData && financialsData.length > 0) {
          officeData.monthly_financials = financialsData.map((row: any) => ({
            year: parseInt(row['Year']),
            month: parseInt(row['Month']),
            revenue: row['Revenue'] || null,
            lab_exp_no_outside: row['Lab Expense (No Outside)'] || null,
            lab_exp_with_outside: row['Lab Expense (With Outside)'] || null,
            outside_lab_spend: row['Outside Lab Spend'] || null,
            teeth_supplies: row['Teeth Supplies'] || null,
            lab_supplies: row['Lab Supplies'] || null,
            personnel_exp: row['Personnel Expense'] || null,
            overtime_exp: row['Overtime Expense'] || null,
            bonus_exp: row['Bonus Expense'] || null,
          }));
        }
      }
      
      // Parse Monthly_Operations sheet (optional)
      const operationsSheet = workbook.Sheets['Monthly_Operations'];
      if (operationsSheet) {
        const operationsData = XLSX.utils.sheet_to_json(operationsSheet);
        if (operationsData && operationsData.length > 0) {
          officeData.monthly_ops = operationsData.map((row: any) => ({
            year: parseInt(row['Year']),
            month: parseInt(row['Month']),
            backlog_case_count: row['Backlog Case Count'] || null,
            overtime_value: row['Overtime Value'] || null,
            labor_model_value: row['Labor Model Value'] || null,
          }));
        }
      }
      
      // Call backend to add office
      const result = await invoke<string>('add_office_from_template', {
        officeData: officeData,
      });
      
      setImportSuccess(true);
      setSelectedFile(null);
      setShowAddOfficeModal(false);
      
      // Reload office list
      await loadOffices();
      
      setTimeout(() => {
        setImportSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to import office:', err);
      setImportError(err instanceof Error ? err.message : 'Failed to import office');
    } finally {
      setImporting(false);
    }
  };

  // Export as CSV
  const exportToCSV = async () => {
    setExporting(true);
    setExportSuccess(false);
    setShowExportMenu(false);
    
    try {
      // Get all offices with lab manager data
      const allOffices = await invoke<any[]>('get_directory_offices_for_export');
      
      // Filter to match current filters
      let exportData = allOffices;
      
      if (dfoFilter !== 'all') {
        exportData = exportData.filter(office => office.dfo === dfoFilter);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        exportData = exportData.filter(office =>
          office.office_name?.toLowerCase().includes(query) ||
          office.office_id?.toString().includes(query) ||
          office.address?.toLowerCase().includes(query)
        );
      }
      
      // Prepare CSV data
      const csvRows = [];
      csvRows.push([
        'Office ID',
        'Office Name',
        'Address',
        'City',
        'State',
        'ZIP',
        'Phone',
        'Managing Dentist',
        'Model',
        'DFO',
        'Status',
        'Lab Manager Name',
        'Lab Manager Email',
        'Lab Manager Phone'
      ]);
      
      exportData.forEach(office => {
        const addressParts = parseAddress(office.address);
        csvRows.push([
          office.office_id || '',
          office.office_name || '',
          addressParts.full,
          addressParts.city,
          addressParts.state,
          addressParts.zip,
          office.phone || '',
          office.managing_dentist || '',
          office.model || '',
          office.dfo || '',
          getStatus(office.standardization_status),
          office.lab_manager_name || '',
          office.lab_manager_email || '',
          office.lab_manager_phone || '',
        ]);
      });
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => 
        row.map(cell => {
          const cellStr = String(cell || '');
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      link.download = `LabPulse_Directory_${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export CSV file');
    } finally {
      setExporting(false);
    }
  };

  // Export as Excel
  const exportToExcel = async () => {
    setExporting(true);
    setExportSuccess(false);
    setShowExportMenu(false);
    
    try {
      // Get all offices with lab manager data
      const allOffices = await invoke<any[]>('get_directory_offices_for_export');
      
      // Filter to match current filters
      let exportData = allOffices;
      
      if (dfoFilter !== 'all') {
        exportData = exportData.filter(office => office.dfo === dfoFilter);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        exportData = exportData.filter(office =>
          office.office_name?.toLowerCase().includes(query) ||
          office.office_id?.toString().includes(query) ||
          office.address?.toLowerCase().includes(query)
        );
      }
      
      // Prepare worksheet data
      const worksheetData = [];
      worksheetData.push([
        'Office ID',
        'Office Name',
        'Address',
        'City',
        'State',
        'ZIP',
        'Phone',
        'Managing Dentist',
        'Model',
        'DFO',
        'Status',
        'Lab Manager Name',
        'Lab Manager Email',
        'Lab Manager Phone'
      ]);
      
      exportData.forEach(office => {
        const addressParts = parseAddress(office.address);
        worksheetData.push([
          office.office_id || '',
          office.office_name || '',
          addressParts.full,
          addressParts.city,
          addressParts.state,
          addressParts.zip,
          office.phone || '',
          office.managing_dentist || '',
          office.model || '',
          office.dfo || '',
          getStatus(office.standardization_status),
          office.lab_manager_name || '',
          office.lab_manager_email || '',
          office.lab_manager_phone || '',
        ]);
      });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 10 }, // Office ID
        { wch: 30 }, // Office Name
        { wch: 40 }, // Address
        { wch: 20 }, // City
        { wch: 5 },  // State
        { wch: 10 }, // ZIP
        { wch: 15 }, // Phone
        { wch: 20 }, // Managing Dentist
        { wch: 10 }, // Model
        { wch: 15 }, // DFO
        { wch: 10 }, // Status
        { wch: 25 }, // Lab Manager Name
        { wch: 30 }, // Lab Manager Email
        { wch: 15 }, // Lab Manager Phone
      ];
      
      // Add filters to header row
      ws['!autofilter'] = { ref: `A1:N${worksheetData.length}` };
      
      XLSX.utils.book_append_sheet(wb, ws, 'Directory');
      
      // Generate file and download
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `LabPulse_Directory_${date}.xlsx`);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Office Directory</h1>
          
          <div className="flex gap-3">
            {/* Add Office Button */}
            <button
              onClick={() => setShowAddOfficeModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              Add Office
            </button>
            
            {/* Export Button */}
            <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Export
                </>
              )}
            </button>
            
            {showExportMenu && !exporting && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button
                  onClick={exportToCSV}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-md flex items-center gap-2"
                >
                  <span>📄</span>
                  Export as CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-md flex items-center gap-2 border-t border-gray-200"
                >
                  <span>📊</span>
                  Export as Excel
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
        
        {/* Export Info */}
        {exportSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
            ✓ Export completed successfully!
          </div>
        )}
        
        <div className="mb-4 text-sm text-gray-600">
          Export will include <span className="font-semibold">{filteredOffices.length}</span> office{filteredOffices.length !== 1 ? 's' : ''} (filtered results)
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="Search by office name, ID, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <select
              value={dfoFilter}
              onChange={(e) => setDfoFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All DFOs</option>
              <option value="Candi Abt">Candi Abt</option>
              <option value="Balt Torres">Balt Torres</option>
            </select>
          </div>
        </div>
      </div>

      {/* Office List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading offices...</div>
      ) : filteredOffices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No offices found</div>
      ) : (
        <div className="space-y-4">
          {filteredOffices.map((office) => (
            <div
              key={office.office_id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loadOfficeDetails(office.office_id, e);
              }}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {office.office_id} - {office.office_name}
                </h2>
                <span className="text-sm text-gray-500">Click to view details →</span>
              </div>

              <div className="space-y-2 text-gray-700">
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span>{office.address || 'Address not available'}</span>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {office.phone && (
                    <div className="flex items-center">
                      <span className="mr-2">🧪</span>
                      <span className="text-sm">Lab Mgr: {office.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <span className="mr-2">📋</span>
                    <span className="text-sm text-gray-500">Office Mgr: Not available</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="mr-2">👨‍⚕️</span>
                  <span className="text-sm">
                    {office.managing_dentist ? `Dr. ${office.managing_dentist}` : 'Managing Dentist: Not available'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedOffice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {officeDetails?.office.office_id} - {officeDetails?.office.office_name}
              </h2>
              <button
                onClick={() => setSelectedOffice(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {detailsLoading ? (
                <div className="text-center py-12 text-gray-500">Loading details...</div>
              ) : officeDetails ? (
                <div className="space-y-6">
                  {/* Office Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <span className="mr-2">📍</span>
                      Office Information
                    </h3>
                    <div className="ml-6 space-y-2 text-gray-700">
                      <div><strong>Office ID:</strong> {officeDetails.office.office_id}</div>
                      <div><strong>Office Name:</strong> {officeDetails.office.office_name}</div>
                      {(() => {
                        const addressParts = parseAddress(officeDetails.office.address);
                        return (
                          <>
                            <div><strong>Address:</strong> {addressParts.full || 'Not available'}</div>
                            {addressParts.city && <div><strong>City:</strong> {addressParts.city}</div>}
                            {addressParts.state && <div><strong>State:</strong> {addressParts.state}</div>}
                            {addressParts.zip && <div><strong>ZIP:</strong> {addressParts.zip}</div>}
                          </>
                        );
                      })()}
                      <div><strong>Phone:</strong> {officeDetails.office.phone || 'Not available'}</div>
                      <div><strong>Model:</strong> {officeDetails.office.model}</div>
                      <div><strong>DFO:</strong> {officeDetails.office.dfo}</div>
                      <div><strong>Status:</strong> {getStatus(officeDetails.office.standardization_status)}</div>
                    </div>
                  </div>

                  {/* Managing Dentist */}
                  {officeDetails.office.managing_dentist && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">👨‍⚕️</span>
                        Managing Dentist
                      </h3>
                      <div className="ml-6 space-y-2 text-gray-700">
                        <div>Dr. {officeDetails.office.managing_dentist}</div>
                      </div>
                    </div>
                  )}

                  {/* Lab Manager */}
                  {officeDetails.lab_manager && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">🧪</span>
                        Lab Manager Contact
                      </h3>
                      <div className="ml-6 space-y-2 text-gray-700">
                        <div><strong>Name:</strong> {officeDetails.lab_manager.name}</div>
                        <div className="flex items-center gap-2">
                          <strong>Email:</strong> {officeDetails.lab_manager.email}
                          <button
                            onClick={() => copyToClipboard(officeDetails.lab_manager!.email)}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>Phone:</strong> {officeDetails.lab_manager.phone}
                          <button
                            onClick={() => copyToClipboard(officeDetails.lab_manager!.phone)}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Staff */}
                  {officeDetails.staff.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <span className="mr-2">👥</span>
                        Staff ({officeDetails.staff.length} people)
                      </h3>
                      <div className="ml-6 space-y-2 text-gray-700">
                        {officeDetails.staff.map((member, index) => (
                          <div key={index}>
                            • {member.name} - {member.position} {member.hire_date && `(hired ${new Date(member.hire_date).toLocaleDateString()})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">Failed to load details</div>
              )}
            </div>

            {/* Modal Footer - Action Buttons */}
            {officeDetails && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Remove Office
                </button>
                <button
                  onClick={handleEditData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Edit Data
                </button>
                <button
                  onClick={() => setSelectedOffice(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remove Office Confirmation Dialog */}
      {showRemoveConfirm && officeDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Office?</h3>
              <p className="text-gray-700 mb-6">
                This will permanently delete <strong>{officeDetails.office.office_name}</strong> and all associated data including financial records, operations data, volume data, contacts, and staff. This cannot be undone.
              </p>
              
              {removeError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                  {removeError}
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setRemoveError(null);
                  }}
                  disabled={removing}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveOffice}
                  disabled={removing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removing ? 'Removing...' : 'Remove Office'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {removeSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>✓</span>
          <span>Office removed successfully</span>
        </div>
      )}

      {/* Add Office Modal */}
      {showAddOfficeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Add New Office</h2>
                <button
                  onClick={() => {
                    setShowAddOfficeModal(false);
                    setSelectedFile(null);
                    setImportError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-700 mb-6">
                Upload a formatted Excel file to import a new office with all its data. 
                Download the template below to see the required format.
              </p>
              
              {/* Download Template Button */}
              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>📥</span>
                  Download Template
                </button>
              </div>
              
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 ${
                  selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {selectedFile ? (
                  <div>
                    <div className="text-green-600 mb-2">✓ File selected</div>
                    <div className="text-sm text-gray-700">{selectedFile.name}</div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-500 mb-4">
                      <span className="text-4xl">📄</span>
                    </div>
                    <p className="text-gray-700 mb-2">Drag and drop your Excel file here, or</p>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block">
                        Browse Files
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {/* Error Message */}
              {importError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                  {importError}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddOfficeModal(false);
                    setSelectedFile(null);
                    setImportError(null);
                  }}
                  disabled={importing}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!selectedFile || importing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Success Message */}
      {importSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>✓</span>
          <span>Office imported successfully</span>
        </div>
      )}
    </div>
  );
}

