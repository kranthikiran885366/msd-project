'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Edit2, Trash2, RefreshCw, Mail, Phone, User } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function BillingContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    role: 'primary',
    department: 'finance'
  });

  // Mock billing contacts
  const mockContacts = [
    {
      id: 'bc-1',
      name: 'Rachel Martinez',
      email: 'rachel.martinez@acme-corp.com',
      phone: '+1-555-123-4567',
      title: 'CFO',
      role: 'primary',
      department: 'finance',
      notificationPreferences: ['invoices', 'payment_issues', 'upgrade_notifications'],
      lastNotified: '2024-12-20T10:00:00Z',
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'bc-2',
      name: 'David Chen',
      email: 'david.chen@acme-corp.com',
      phone: '+1-555-234-5678',
      title: 'Senior Accountant',
      role: 'secondary',
      department: 'finance',
      notificationPreferences: ['invoices', 'payment_issues'],
      lastNotified: '2024-12-19T14:30:00Z',
      createdAt: '2024-02-10T10:15:00Z'
    },
    {
      id: 'bc-3',
      name: 'Jennifer Lee',
      email: 'jennifer.lee@acme-corp.com',
      phone: '+1-555-345-6789',
      title: 'IT Operations Manager',
      role: 'technical',
      department: 'it',
      notificationPreferences: ['technical_issues', 'subscription_updates', 'billing_updates'],
      lastNotified: '2024-12-18T09:15:00Z',
      createdAt: '2024-03-05T11:30:00Z'
    },
    {
      id: 'bc-4',
      name: 'Mark Thompson',
      email: 'mark.thompson@acme-corp.com',
      phone: '+1-555-456-7890',
      title: 'Procurement Officer',
      role: 'secondary',
      department: 'procurement',
      notificationPreferences: ['invoices', 'contract_updates'],
      lastNotified: '2024-12-17T16:00:00Z',
      createdAt: '2024-04-12T09:00:00Z'
    },
    {
      id: 'bc-5',
      name: 'Sarah Anderson',
      email: 'sarah.anderson@acme-corp.com',
      phone: '+1-555-567-8901',
      title: 'Legal Compliance Officer',
      role: 'legal',
      department: 'legal',
      notificationPreferences: ['contract_updates', 'compliance_updates'],
      lastNotified: '2024-12-15T10:30:00Z',
      createdAt: '2024-05-20T13:45:00Z'
    }
  ];

  useEffect(() => {
    setContacts(mockContacts);
    setLoading(false);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      title: '',
      role: 'primary',
      department: 'finance'
    });
    setEditingId(null);
  };

  const handleAddContact = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.addBillingContact(formData);

      if (response.success) {
        const newContact = {
          id: `bc-${contacts.length + 1}`,
          ...formData,
          notificationPreferences: ['invoices'],
          lastNotified: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        setContacts([...contacts, newContact]);
        setSuccessMessage('Billing contact added successfully');
        resetForm();
        setShowForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to add contact');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleEditContact = (contact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      title: contact.title,
      role: contact.role,
      department: contact.department
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleUpdateContact = async () => {
    try {
      setError('');
      const response = await apiClient.updateBillingContact(editingId, formData);

      if (response.success) {
        setContacts(contacts.map(c =>
          c.id === editingId ? {...c, ...formData} : c
        ));
        setSuccessMessage('Billing contact updated successfully');
        resetForm();
        setShowForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to update contact');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to remove this billing contact?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.removeBillingContact(contactId);

      if (response.success) {
        setContacts(contacts.filter(c => c.id !== contactId));
        setSuccessMessage('Billing contact removed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to remove contact');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const primaryContact = contacts.find(c => c.role === 'primary');
  const secondaryContacts = contacts.filter(c => c.role === 'secondary');
  const technicalContacts = contacts.filter(c => c.role === 'technical');
  const legalContacts = contacts.filter(c => c.role === 'legal');

  const roleColors = {
    primary: 'bg-red-100 text-red-800',
    secondary: 'bg-blue-100 text-blue-800',
    technical: 'bg-green-100 text-green-800',
    legal: 'bg-purple-100 text-purple-800'
  };

  const departmentColors = {
    finance: 'bg-blue-50',
    it: 'bg-green-50',
    procurement: 'bg-yellow-50',
    legal: 'bg-purple-50',
    operations: 'bg-gray-50'
  };

  const renderContact = (contact) => (
    <Card key={contact.id} className={`hover:shadow-md transition ${departmentColors[contact.department] || 'bg-white'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">{contact.name}</h3>
                <p className="text-sm text-muted-foreground">{contact.title}</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={roleColors[contact.role]}>
                {contact.role}
              </Badge>
              <Badge variant="outline">{contact.department}</Badge>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-3 border-t text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline break-all">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                  {contact.phone}
                </a>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2 font-semibold">Notifications:</p>
              <div className="flex flex-wrap gap-2">
                {contact.notificationPreferences.map(pref => (
                  <Badge key={pref} variant="secondary" className="text-xs">
                    {pref.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Last Notified */}
            <p className="text-xs text-muted-foreground mt-2">
              Last notified: {new Date(contact.lastNotified).toLocaleString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditContact(contact)}
              className="gap-1"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteContact(contact.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Billing Contacts</h1>
          <p className="text-muted-foreground">Manage contacts for billing and administrative notifications</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Contacts</p>
              <p className="text-3xl font-bold">{contacts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Primary</p>
              <p className="text-3xl font-bold">{primaryContact ? 1 : 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Secondary</p>
              <p className="text-3xl font-bold">{secondaryContacts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Technical</p>
              <p className="text-3xl font-bold">{technicalContacts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Billing Contact' : 'Add New Billing Contact'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1-555-123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., CFO, IT Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="primary">Primary (receives all notifications)</option>
                  <option value="secondary">Secondary (billing alerts)</option>
                  <option value="technical">Technical (technical issues)</option>
                  <option value="legal">Legal (contracts & compliance)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="finance">Finance</option>
                  <option value="it">IT</option>
                  <option value="procurement">Procurement</option>
                  <option value="legal">Legal</option>
                  <option value="operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={editingId ? handleUpdateContact : handleAddContact} className="flex-1">
                {editingId ? 'Update Contact' : 'Add Contact'}
              </Button>
              <Button onClick={() => { resetForm(); setShowForm(false); }} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Contact */}
      {primaryContact && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Primary Contact</h2>
          {renderContact(primaryContact)}
        </div>
      )}

      {/* Secondary Contacts */}
      {secondaryContacts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Secondary Contacts</h2>
          <div className="space-y-3">
            {secondaryContacts.map(renderContact)}
          </div>
        </div>
      )}

      {/* Technical Contacts */}
      {technicalContacts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Technical Contacts</h2>
          <div className="space-y-3">
            {technicalContacts.map(renderContact)}
          </div>
        </div>
      )}

      {/* Legal Contacts */}
      {legalContacts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Legal Contacts</h2>
          <div className="space-y-3">
            {legalContacts.map(renderContact)}
          </div>
        </div>
      )}

      {contacts.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground">No billing contacts configured yet</p>
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">Primary Contact</p>
            <p className="text-muted-foreground">Designate one primary contact who receives all critical billing notifications and payment alerts.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Multiple Contacts</p>
            <p className="text-muted-foreground">Add secondary contacts for redundancy. If the primary is unavailable, notifications continue to secondary contacts.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Keep Updated</p>
            <p className="text-muted-foreground">Ensure contact information is current and email addresses are actively monitored. Update details when staff changes occur.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
