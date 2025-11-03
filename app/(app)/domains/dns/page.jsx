'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Trash2, Edit2, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DNSRecordsPage() {
  const [records, setRecords] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newRecord, setNewRecord] = useState({
    name: '',
    type: 'A',
    value: '',
    ttl: '3600',
    priority: '10'
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      fetchDNSRecords();
    }
  }, [selectedDomain]);

  const fetchDomains = async () => {
    try {
      setError('');
      const response = await apiClient.getDomains();

      if (response.success) {
        setDomains(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedDomain(response.data[0].id);
        }
      } else {
        setError(response.error || 'Failed to fetch domains');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchDNSRecords = async () => {
    try {
      setError('');
      const response = await apiClient.getDNSRecords({ domainId: selectedDomain });

      if (response.success) {
        setRecords(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch DNS records');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleAddRecord = async () => {
    try {
      setError('');

      if (!newRecord.name || !newRecord.value) {
        setError('Name and value are required');
        return;
      }

      setSaving(true);
      const response = await apiClient.addDNSRecord({
        domainId: selectedDomain,
        ...newRecord
      });

      if (response.success) {
        setRecords([...records, response.data]);
        setNewRecord({
          name: '',
          type: 'A',
          value: '',
          ttl: '3600',
          priority: '10'
        });
        setShowAddForm(false);
        setSuccessMessage('DNS record added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to add DNS record');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Delete this DNS record?')) return;

    try {
      setError('');
      setSaving(true);
      const response = await apiClient.deleteDNSRecord(recordId);

      if (response.success) {
        setRecords(records.filter(r => r.id !== recordId));
        setSuccessMessage('DNS record deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete DNS record');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyValue = (value) => {
    navigator.clipboard.writeText(value);
  };

  const getTypeColor = (type) => {
    const colors = {
      'A': 'bg-blue-100 text-blue-800',
      'AAAA': 'bg-purple-100 text-purple-800',
      'CNAME': 'bg-green-100 text-green-800',
      'MX': 'bg-orange-100 text-orange-800',
      'TXT': 'bg-pink-100 text-pink-800',
      'NS': 'bg-red-100 text-red-800',
      'SRV': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading DNS records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">DNS Records</h1>
        <p className="text-muted-foreground">
          Manage DNS records for your domains
        </p>
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

      {/* Domain Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">Select Domain</Label>
              <select
                id="domain"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={fetchDNSRecords}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Record Form */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add DNS Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Record Name</Label>
                <Input
                  id="name"
                  placeholder="www"
                  value={newRecord.name}
                  onChange={(e) => setNewRecord({...newRecord, name: e.target.value})}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Record Type</Label>
                <select
                  id="type"
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                  disabled={saving}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>A</option>
                  <option>AAAA</option>
                  <option>CNAME</option>
                  <option>MX</option>
                  <option>TXT</option>
                  <option>NS</option>
                  <option>SRV</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  placeholder="192.168.1.1"
                  value={newRecord.value}
                  onChange={(e) => setNewRecord({...newRecord, value: e.target.value})}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttl">TTL (seconds)</Label>
                <Input
                  id="ttl"
                  type="number"
                  value={newRecord.ttl}
                  onChange={(e) => setNewRecord({...newRecord, ttl: e.target.value})}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRecord}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Records ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No DNS records</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-center py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Value</th>
                    <th className="text-right py-3 px-4 font-semibold">TTL</th>
                    <th className="text-center py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-semibold">{record.name}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getTypeColor(record.type)}>
                          {record.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted rounded px-2 py-1">
                            {record.value}
                          </code>
                          <button
                            onClick={() => handleCopyValue(record.value)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">{record.ttl}s</td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteRecord(record.id)}
                          disabled={saving}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common DNS Records Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Common DNS Record Types</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p><strong>A:</strong> Maps domain name to IPv4 address</p>
          <p><strong>AAAA:</strong> Maps domain name to IPv6 address</p>
          <p><strong>CNAME:</strong> Canonical name - alias for another domain</p>
          <p><strong>MX:</strong> Mail exchange - directs email to mail server</p>
          <p><strong>TXT:</strong> Text record - used for verification and SPF/DKIM</p>
          <p><strong>NS:</strong> Nameserver - delegates domain to nameserver</p>
        </CardContent>
      </Card>
    </div>
  );
}
