import { useState, useEffect } from 'react';
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
  const loadOfficeDetails = async (officeId: number) => {
    setDetailsLoading(true);
    setSelectedOffice(officeId);
    try {
      const data = await invoke<OfficeDetails>('get_directory_office_details', { officeId });
      setOfficeDetails(data);
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
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {office.office_id} - {office.office_name}
                </h2>
                <button
                  onClick={() => loadOfficeDetails(office.office_id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details →
                </button>
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
                      <div><strong>Address:</strong> {officeDetails.office.address || 'Not available'}</div>
                      <div><strong>Phone:</strong> {officeDetails.office.phone || 'Not available'}</div>
                      <div><strong>Model:</strong> {officeDetails.office.model}</div>
                      <div><strong>DFO:</strong> {officeDetails.office.dfo}</div>
                      {officeDetails.office.standardization_status && (
                        <div><strong>Status:</strong> {officeDetails.office.standardization_status}</div>
                      )}
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
          </div>
        </div>
      )}
    </div>
  );
}

