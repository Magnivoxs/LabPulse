import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Office Directory</h1>
        
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

