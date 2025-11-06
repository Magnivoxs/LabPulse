import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { labsAPI, employeesAPI, metricsAPI } from '../services/api';
import type { Lab } from '../types';

export default function LabsManagementPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [selectedLabForForms, setSelectedLabForForms] = useState<string>('');

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    try {
      const data = await labsAPI.getAll();
      setLabs(data);
    } catch (error) {
      console.error('Failed to load labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLab = () => {
    setSelectedLab(null);
    setShowLabModal(true);
  };

  const handleEditLab = (lab: Lab) => {
    setSelectedLab(lab);
    setShowLabModal(true);
  };

  const handleDeleteLab = async (lab: Lab) => {
    if (!confirm(`Are you sure you want to delete ${lab.city}, ${lab.state}?`)) return;

    try {
      await labsAPI.delete(lab.id);
      await loadLabs();
    } catch (error) {
      alert('Failed to delete lab');
    }
  };

  const handleAddEmployee = (labId: string) => {
    setSelectedLabForForms(labId);
    setShowEmployeeModal(true);
  };

  const handleAddMetric = (labId: string) => {
    setSelectedLabForForms(labId);
    setShowMetricModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Labs Management</h2>
        <button onClick={handleAddLab} className="btn btn-primary flex items-center">
          <Plus size={20} className="mr-2" />
          Add Lab
        </button>
      </div>

      <div className="space-y-6">
        {labs.map((lab) => (
          <div key={lab.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {lab.city}, {lab.state}
                </h3>
                <p className="text-sm text-gray-600">
                  Office #{lab.officeId} • {lab.practiceModel}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditLab(lab)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDeleteLab(lab)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-xs text-gray-600">Managing Dentist</p>
                <p className="font-medium">{lab.managingDentist}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Lab Manager</p>
                <p className="font-medium">{lab.labManagerName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Staff</p>
                <p className="font-medium">{lab.totalStaff}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Phone</p>
                <p className="font-medium">{lab.phone}</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleAddEmployee(lab.id)}
                className="btn btn-secondary flex items-center text-sm"
              >
                <Plus size={16} className="mr-1" />
                Add Employee
              </button>
              <button
                onClick={() => handleAddMetric(lab.id)}
                className="btn btn-secondary flex items-center text-sm"
              >
                <Plus size={16} className="mr-1" />
                Add Monthly Data
              </button>
            </div>
          </div>
        ))}
      </div>

      {labs.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-600">No labs found. Add your first lab to get started.</p>
        </div>
      )}

      {/* Modals */}
      {showLabModal && (
        <LabFormModal
          lab={selectedLab}
          onClose={() => {
            setShowLabModal(false);
            loadLabs();
          }}
        />
      )}
      {showEmployeeModal && (
        <EmployeeFormModal
          labId={selectedLabForForms}
          onClose={() => {
            setShowEmployeeModal(false);
            loadLabs();
          }}
        />
      )}
      {showMetricModal && (
        <MetricFormModal
          labId={selectedLabForForms}
          onClose={() => {
            setShowMetricModal(false);
          }}
        />
      )}
    </div>
  );
}

// Lab Form Modal
function LabFormModal({ lab, onClose }: { lab: Lab | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    officeId: lab?.officeId || '',
    city: lab?.city || '',
    state: lab?.state || '',
    practiceModel: lab?.practiceModel || 'PO',
    address: lab?.address || '',
    phone: lab?.phone || '',
    managingDentist: lab?.managingDentist || '',
    directorFieldOps: lab?.directorFieldOps || '',
    standardizationStatus: lab?.standardizationStatus || 'Training Plan',
    hasBacklog: lab?.hasBacklog || false,
    hasOvertime: lab?.hasOvertime || false,
    laborModel: lab?.laborModel || 0,
    labManagerName: lab?.labManagerName || '',
    labManagerEmail: lab?.labManagerEmail || '',
    labManagerPhone: lab?.labManagerPhone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (lab) {
        await labsAPI.update(lab.id, formData);
      } else {
        await labsAPI.create(formData);
      }
      onClose();
    } catch (error) {
      alert('Failed to save lab');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">{lab ? 'Edit Lab' : 'Add Lab'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Office ID</label>
              <input
                type="text"
                className="input"
                value={formData.officeId}
                onChange={(e) => setFormData({ ...formData, officeId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                className="input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                className="input"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Practice Model</label>
              <select
                className="input"
                value={formData.practiceModel}
                onChange={(e) =>
                  setFormData({ ...formData, practiceModel: e.target.value as 'PO' | 'PLLC' })
                }
              >
                <option value="PO">PO</option>
                <option value="PLLC">PLLC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <input
              type="text"
              className="input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Managing Dentist</label>
              <input
                type="text"
                className="input"
                value={formData.managingDentist}
                onChange={(e) => setFormData({ ...formData, managingDentist: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Director of Field Operations</label>
              <input
                type="text"
                className="input"
                value={formData.directorFieldOps}
                onChange={(e) => setFormData({ ...formData, directorFieldOps: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Standardization Status</label>
              <select
                className="input"
                value={formData.standardizationStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    standardizationStatus: e.target.value as 'Training Plan' | 'Graduated',
                  })
                }
              >
                <option value="Training Plan">Training Plan</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Lab Manager Information</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.labManagerName}
                  onChange={(e) => setFormData({ ...formData, labManagerName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.labManagerEmail}
                  onChange={(e) => setFormData({ ...formData, labManagerEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.labManagerPhone}
                  onChange={(e) => setFormData({ ...formData, labManagerPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Operational Status</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasBacklog}
                    onChange={(e) => setFormData({ ...formData, hasBacklog: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Backlog</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasOvertime}
                    onChange={(e) => setFormData({ ...formData, hasOvertime: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Overtime</span>
                </label>
              </div>
              <div>
                <label className="label">Labor Model</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={formData.laborModel}
                  onChange={(e) =>
                    setFormData({ ...formData, laborModel: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {lab ? 'Update Lab' : 'Create Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Employee Form Modal
function EmployeeFormModal({ labId, onClose }: { labId: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    position: 'Full Tech' as 'Lab Manager' | 'Full Tech' | 'Waxer Finisher' | 'Processor',
    hireDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    labId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeesAPI.create(formData);
      onClose();
    } catch (error) {
      alert('Failed to add employee');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">Add Employee</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Position</label>
            <select
              className="input"
              value={formData.position}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  position: e.target.value as typeof formData.position,
                })
              }
            >
              <option value="Lab Manager">Lab Manager</option>
              <option value="Full Tech">Full Tech</option>
              <option value="Waxer Finisher">Waxer Finisher</option>
              <option value="Processor">Processor</option>
            </select>
          </div>

          <div>
            <label className="label">Hire Date</label>
            <input
              type="date"
              className="input"
              value={formData.hireDate}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Email (Optional)</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone (Optional)</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Metric Form Modal
function MetricFormModal({ labId, onClose }: { labId: string; onClose: () => void }) {
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    dentureUnits: 0,
    patientVolume: 0,
    practiceRevenue: 0,
    totalLabExpenses: 0,
    teethSupplies: 0,
    labSupplies: 0,
    totalLabExpensesWithOutside: 0,
    totalPersonnelExpenses: 0,
    overtimeExpenses: 0,
    bonuses: 0,
    hadBacklog: false,
    hadOvertime: false,
    labId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await metricsAPI.save(formData);
      alert('Monthly data saved successfully!');
      onClose();
    } catch (error) {
      alert('Failed to save monthly data');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">Add Monthly Data</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Month</label>
              <select
                className="input"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                className="input"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                min="2020"
                max="2100"
                required
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Denture Units</label>
                <input
                  type="number"
                  className="input"
                  value={formData.dentureUnits}
                  onChange={(e) =>
                    setFormData({ ...formData, dentureUnits: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="label">Patient Volume</label>
                <input
                  type="number"
                  className="input"
                  value={formData.patientVolume}
                  onChange={(e) =>
                    setFormData({ ...formData, patientVolume: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="label">Practice Revenue ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.practiceRevenue}
                  onChange={(e) =>
                    setFormData({ ...formData, practiceRevenue: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Expenses</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Lab Expenses ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.totalLabExpenses}
                  onChange={(e) =>
                    setFormData({ ...formData, totalLabExpenses: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="label">Total Lab Expenses w/ Outside ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.totalLabExpensesWithOutside}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalLabExpensesWithOutside: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Teeth Supplies ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.teethSupplies}
                  onChange={(e) =>
                    setFormData({ ...formData, teethSupplies: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="label">Lab Supplies ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.labSupplies}
                  onChange={(e) =>
                    setFormData({ ...formData, labSupplies: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="label">Total Personnel Expenses ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.totalPersonnelExpenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalPersonnelExpenses: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Overtime Expenses ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.overtimeExpenses}
                  onChange={(e) =>
                    setFormData({ ...formData, overtimeExpenses: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="label">Bonuses ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.bonuses}
                  onChange={(e) =>
                    setFormData({ ...formData, bonuses: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Status Indicators</h4>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hadBacklog}
                  onChange={(e) => setFormData({ ...formData, hadBacklog: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Had Backlog</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hadOvertime}
                  onChange={(e) => setFormData({ ...formData, hadOvertime: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Had Overtime</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Monthly Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
