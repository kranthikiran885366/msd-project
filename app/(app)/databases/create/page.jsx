'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CreateDatabasePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    description: '',
    
    // Step 2
    type: 'postgresql',
    version: '14',
    
    // Step 3
    size: 'medium',
    replicated: false,
    backupFrequency: 'daily',
    
    // Step 4
    environment: 'production'
  });

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleCreateDatabase = async () => {
    try {
      setError('');
      setLoading(true);

      const databaseData = {
        name: formData.name,
        displayName: formData.name,
        type: formData.type,
        size: formData.size,
        region: 'iad1', // Default region
        projectId: '507f1f77bcf86cd799439011', // Default project ID
        backupEnabled: true,
        backupSchedule: formData.backupFrequency,
        sslEnabled: true,
        host: `${formData.name}-${formData.type}.db.example.com`,
        port: formData.type === 'postgresql' ? 5432 : formData.type === 'mysql' ? 3306 : formData.type === 'mongodb' ? 27017 : 6379,
        database: formData.name,
        username: 'admin',
        password: 'generated_password_123'
      };

      const response = await apiClient.createDatabase(databaseData);

      if (response) {
        setSuccessMessage('Database created successfully!');
        setTimeout(() => {
          window.location.href = '/databases';
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create Database</h1>
        <p className="text-muted-foreground">
          Step {step} of 4
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
          ></div>
        ))}
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

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Database Name</Label>
              <Input
                id="name"
                placeholder="my-app-db"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only alphanumeric characters and hyphens allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                placeholder="Database for production API..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Database Type */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Database Type & Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Database Type</Label>
              {['postgresql', 'mysql', 'mongodb', 'redis'].map(type => (
                <label key={type} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    checked={formData.type === type}
                    onChange={() => handleInputChange('type', type)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-sm capitalize">{type}</p>
                    <p className="text-xs text-muted-foreground">
                      {type === 'postgresql' && 'Reliable relational database'}
                      {type === 'mysql' && 'Popular open-source database'}
                      {type === 'mongodb' && 'NoSQL document database'}
                      {type === 'redis' && 'In-memory data store'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <select
                id="version"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option>12</option>
                <option>13</option>
                <option>14</option>
                <option>15</option>
                <option>16</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configuration */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Instance Size</Label>
              {['small', 'medium', 'large', 'xlarge'].map(size => (
                <label key={size} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    checked={formData.size === size}
                    onChange={() => handleInputChange('size', size)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-sm capitalize">{size}</p>
                    <p className="text-xs text-muted-foreground">
                      {size === 'small' && '2 CPU, 4GB RAM, 100GB storage'}
                      {size === 'medium' && '4 CPU, 16GB RAM, 500GB storage'}
                      {size === 'large' && '8 CPU, 32GB RAM, 1TB storage'}
                      {size === 'xlarge' && '16 CPU, 64GB RAM, 2TB storage'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={formData.replicated}
                onChange={(e) => handleInputChange('replicated', e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <p className="font-semibold text-sm">Enable Replication</p>
                <p className="text-xs text-muted-foreground">
                  Automatic failover with read replicas for high availability
                </p>
              </div>
            </label>

            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <select
                id="backupFrequency"
                value={formData.backupFrequency}
                onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Environment */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Environment & Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Environment</Label>
              {['production', 'staging', 'development'].map(env => (
                <label key={env} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    checked={formData.environment === env}
                    onChange={() => handleInputChange('environment', env)}
                    className="w-4 h-4"
                  />
                  <p className="font-semibold text-sm capitalize">{env}</p>
                </label>
              ))}
            </div>

            {/* Review */}
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-base">Review Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-semibold capitalize">{formData.type} {formData.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-semibold capitalize">{formData.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Replication:</span>
                  <span className="font-semibold">{formData.replicated ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <span className="font-semibold capitalize">{formData.environment}</span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setStep(step - 1)}
          disabled={step === 1 || loading}
          variant="outline"
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={loading}
            className="gap-2 flex-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateDatabase}
            disabled={loading || !formData.name}
            className="gap-2 flex-1"
          >
            {loading ? 'Creating...' : 'Create Database'}
          </Button>
        )}
      </div>
    </div>
  );
}
