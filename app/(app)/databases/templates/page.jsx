'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Copy, Plus, Code, RefreshCw, Download } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function InfrastructureTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);



  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setError('');
        const response = await apiClient.getDatabaseTemplates();
        setTemplates(response || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadTemplate = (template) => {
    const yaml = template.yaml;
    const blob = new Blob([yaml], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.yaml`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccessMessage(`Downloaded ${template.name} template`);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleDeployTemplate = async (templateId) => {
    try {
      setError('');
      const response = await apiClient.createDatabaseFromTemplate(templateId, {
        projectId: '507f1f77bcf86cd799439011', // Default project ID
        name: `db-from-template-${Date.now()}`,
        config: {}
      });
      
      if (response) {
        setSuccessMessage('Database created from template successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to deploy template');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Infrastructure Templates</h1>
        <p className="text-muted-foreground">Pre-built configurations for common deployment scenarios</p>
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
              <p className="text-sm text-muted-foreground">Total Templates</p>
              <p className="text-3xl font-bold">{templates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Database Types</p>
              <p className="text-3xl font-bold">{[...new Set(templates.map(t => t.type))].length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-3xl font-bold text-green-600">{templates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ready to Use</p>
              <p className="text-3xl font-bold">{templates.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No templates available</p>
            <p className="text-sm text-muted-foreground mt-2">Check back later for pre-built database templates</p>
          </div>
        ) : (
          templates.map(template => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 whitespace-nowrap">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Type & Size */}
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="capitalize">{template.type}</Badge>
                  <p className="font-semibold text-sm capitalize">{template.size}</p>
                </div>

                {/* Tables */}
                {template.tables && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Included Tables</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tables.map((table, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="text-sm text-muted-foreground">
                  {template.description}
                </div>
              </CardContent>

              {/* Actions */}
              <div className="p-4 border-t space-y-2">
                <Button 
                  onClick={() => handleDeployTemplate(template.id)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create from Template
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Custom Template */}
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Don't see a template that fits your needs? Create a custom template based on your specifications.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Template
          </Button>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Using Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-sm mb-1">✓ Review before deployment</p>
            <p className="text-sm text-muted-foreground">Always review the YAML configuration to ensure it meets your requirements</p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">✓ Start with staging</p>
            <p className="text-sm text-muted-foreground">Deploy to staging environment first to test the configuration</p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">✓ Customize as needed</p>
            <p className="text-sm text-muted-foreground">Modify the template to add your custom configuration and specific requirements</p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">✓ Monitor deployment</p>
            <p className="text-sm text-muted-foreground">Monitor the deployment process and verify all components are running correctly</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
