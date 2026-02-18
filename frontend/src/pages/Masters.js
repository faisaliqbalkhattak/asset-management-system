import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';

const Masters = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Master Data</h1>

      <HumanResourceSection />
      <EquipmentSection />
      <ExpenseCategorySection />
    </div>
  );
};

// Human Resource Section
const HumanResourceSection = () => {
  const { humanResources, addHumanResource, updateHumanResource, deleteHumanResource } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    employee_name: '',
    designation: '',
    base_salary: '',
    phone: '',
    address: '',
    joining_date: '',
    status: 'active',
  });

  // Form validation
  const isFormValid = formData.employee_name && formData.designation;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const submitData = {
        employee_name: formData.employee_name,
        designation: formData.designation,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
        phone: formData.phone,
        address: formData.address,
        joining_date: formData.joining_date,
        status: formData.status,
      };
      if (editingId) {
        await updateHumanResource(editingId, submitData);
        setSuccess('Employee updated successfully!');
      } else {
        await addHumanResource(submitData);
        setSuccess('Employee added successfully!');
      }
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving employee');
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      employee_name: item.employee_name || '',
      designation: item.designation || '',
      base_salary: item.base_salary?.toString() || '',
      phone: item.phone || '',
      address: item.address || '',
      joining_date: item.joining_date || '',
      status: item.status || 'active',
    });
    setEditingId(item.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteHumanResource(id);
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting employee');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employee_name: '',
      designation: '',
      base_salary: '',
      phone: '',
      address: '',
      joining_date: '',
      status: 'active',
    });
    setEditingId(null);
    setShowForm(false);
    setIsSubmitting(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-pink-50 border-b border-pink-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-pink-800">Human Resources</h2>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'}>
          {showForm ? 'Cancel' : '+ Add Employee'}
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-pink-50">
          <h3 className="text-md font-medium text-gray-800 mb-4">
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee_name">Employee Name *</Label>
                <Input
                  id="employee_name"
                  name="employee_name"
                  value={formData.employee_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g., Operator, Driver, Helper"
                  required
                />
              </div>
              <div>
                <Label htmlFor="base_salary">Base Salary</Label>
                <Input
                  type="number"
                  id="base_salary"
                  name="base_salary"
                  value={formData.base_salary}
                  onChange={handleChange}
                  placeholder="Monthly salary"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="joining_date">Joining Date</Label>
                <Input
                  type="date"
                  id="joining_date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full address"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joining Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {humanResources.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No employees added yet
                </td>
              </tr>
            ) : (
              humanResources.map((emp) => (
                <tr key={emp.id} className="hover:bg-pink-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.employee_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{emp.designation}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {emp.base_salary?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.joining_date || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {emp.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Equipment Section - CRUD for equipment
const EquipmentSection = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment, equipmentTypes, rateTypes } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    equipment_code: '',
    equipment_name: '',
    equipment_type: 'GENERATOR',
    rate_type: 'PER_DAY',
    default_rate: '',
    capacity_cft: '',
    status: 'active',
  });

  const TYPE_COLORS = {
    GENERATOR: 'bg-yellow-100 text-yellow-800',
    EXCAVATOR: 'bg-orange-100 text-orange-800',
    LOADER: 'bg-blue-100 text-blue-800',
    DUMPER: 'bg-purple-100 text-purple-800',
  };

  const isFormValid = formData.equipment_code && formData.equipment_name && formData.equipment_type && formData.rate_type;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const submitData = {
        equipment_code: formData.equipment_code,
        equipment_name: formData.equipment_name,
        equipment_type: formData.equipment_type,
        rate_type: formData.rate_type,
        default_rate: formData.default_rate ? parseFloat(formData.default_rate) : 0,
        capacity_cft: formData.capacity_cft ? parseFloat(formData.capacity_cft) : 0,
        is_active: formData.status === 'active' ? 1 : 0,
      };
      if (editingId) {
        await updateEquipment(editingId, submitData);
        setSuccess('Equipment updated successfully!');
      } else {
        await addEquipment(submitData);
        setSuccess('Equipment added successfully!');
      }
      setTimeout(() => resetForm(), 2000);
    } catch (err) {
      setError(err.message || 'Error saving equipment');
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      equipment_code: item.equipment_code || '',
      equipment_name: item.equipment_name || '',
      equipment_type: item.equipment_type || 'GENERATOR',
      rate_type: item.rate_type || 'PER_DAY',
      default_rate: item.default_rate?.toString() || '',
      capacity_cft: item.capacity_cft?.toString() || '',
      status: item.is_active === 0 ? 'inactive' : 'active',
    });
    setEditingId(item.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await deleteEquipment(id);
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting equipment');
      }
    }
  };

  const resetForm = () => {
    setFormData({ equipment_code: '', equipment_name: '', equipment_type: 'GENERATOR', rate_type: 'PER_DAY', default_rate: '', capacity_cft: '', status: 'active' });
    setEditingId(null);
    setShowForm(false);
    setIsSubmitting(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-emerald-800">Equipment</h2>
          <p className="text-sm text-emerald-600">Add and manage equipment for daily operations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'}>
          {showForm ? 'Cancel' : '+ Add Equipment'}
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-emerald-50">
          <h3 className="text-md font-medium text-gray-800 mb-4">
            {editingId ? 'Edit Equipment' : 'Add New Equipment'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-6 gap-4">
              <div>
                <Label htmlFor="equipment_code">Equipment Code *</Label>
                <Input
                  id="equipment_code"
                  name="equipment_code"
                  value={formData.equipment_code}
                  onChange={handleChange}
                  placeholder="e.g., GEN-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="equipment_name">Equipment Name *</Label>
                <Input
                  id="equipment_name"
                  name="equipment_name"
                  value={formData.equipment_name}
                  onChange={handleChange}
                  placeholder="e.g., Generator 500 KVA"
                  required
                />
              </div>
              <div>
                <Label htmlFor="equipment_type">Type *</Label>
                <select
                  id="equipment_type"
                  name="equipment_type"
                  value={formData.equipment_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {equipmentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="rate_type">Rate Type *</Label>
                <select
                  id="rate_type"
                  name="rate_type"
                  value={formData.rate_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {rateTypes.map((type) => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="default_rate">Default Rate</Label>
                <Input
                  id="default_rate"
                  name="default_rate"
                  type="number"
                  value={formData.default_rate}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Equipment' : 'Add Equipment'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipment.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No equipment added yet. Click "Add Equipment" to get started.
                </td>
              </tr>
            ) : (
              equipment.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${editingId === item.id ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{item.equipment_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${TYPE_COLORS[item.equipment_type] || 'bg-gray-100 text-gray-800'}`}>
                      {item.equipment_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.equipment_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.rate_type?.replace('_', ' ') || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.default_rate || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      item.is_active !== 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.is_active !== 0 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Expense Category Section - CRUD for categories
const ExpenseCategorySection = () => {
  const { expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'bg-gray-100 text-gray-800',
  });

  const COLOR_OPTIONS = [
    { value: 'bg-red-100 text-red-800', label: 'Red' },
    { value: 'bg-orange-100 text-orange-800', label: 'Orange' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
    { value: 'bg-green-100 text-green-800', label: 'Green' },
    { value: 'bg-blue-100 text-blue-800', label: 'Blue' },
    { value: 'bg-purple-100 text-purple-800', label: 'Purple' },
    { value: 'bg-pink-100 text-pink-800', label: 'Pink' },
    { value: 'bg-gray-100 text-gray-800', label: 'Gray' },
  ];

  const isFormValid = formData.name;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await updateExpenseCategory(editingId, formData);
        setSuccess('Category updated successfully!');
      } else {
        await addExpenseCategory(formData);
        setSuccess('Category added successfully!');
      }
      setTimeout(() => resetForm(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving category');
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.category_name || item.name || '',
      description: item.description || '',
      color: item.color || 'bg-gray-100 text-gray-800',
    });
    setEditingId(item.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteExpenseCategory(id);
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting category');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: 'bg-gray-100 text-gray-800' });
    setEditingId(null);
    setShowForm(false);
    setIsSubmitting(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-red-800">Expense Categories</h2>
          <p className="text-sm text-red-600">Add and manage expense categories</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'}>
          {showForm ? 'Cancel' : '+ Add Category'}
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-red-50">
          <h3 className="text-md font-medium text-gray-800 mb-4">
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Blasting Material"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <select
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenseCategories.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No expense categories added yet. Click "Add Category" to get started.
                </td>
              </tr>
            ) : (
              expenseCategories.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${editingId === item.id ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category_name || item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${item.color || 'bg-gray-100 text-gray-800'}`}>
                      {item.category_name || item.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Masters;
