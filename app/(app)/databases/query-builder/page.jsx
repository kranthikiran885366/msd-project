'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Play, Copy, Download, RefreshCw, Zap, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function QueryBuilderPage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [executionTime, setExecutionTime] = useState(null);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await apiClient.getDatabases();
        setDatabases(response || []);
        if (response?.length > 0 && !selectedDatabase) {
          setSelectedDatabase(response[0]._id);
        }
      } catch (err) {
        setError('Failed to fetch databases');
      }
    };
    
    fetchDatabases();
  }, []);

  const handleExecuteQuery = async () => {
    try {
      setError('');
      setSuccessMessage('');

      if (!selectedDatabase) {
        setError('Please select a database');
        return;
      }

      if (!query.trim()) {
        setError('Please enter a query');
        return;
      }

      setLoading(true);
      const startTime = performance.now();

      const response = await apiClient.executeQuery(selectedDatabase, query);
      
      const endTime = performance.now();
      setExecutionTime((endTime - startTime).toFixed(2));

      if (response) {
        setResults({
          rows: response.results || [],
          success: response.success,
          query: response.query,
          duration: response.duration
        });
        setSuccessMessage('Query executed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
    setSuccessMessage('Query copied to clipboard');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleDownloadResults = () => {
    if (!results) return;
    const csv = results.rows.map(row => Object.values(row).join(',')).join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'query-results.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const templates = [
    {
      name: 'Select All Users',
      query: 'SELECT * FROM users LIMIT 10'
    },
    {
      name: 'Count Records',
      query: 'SELECT COUNT(*) as total FROM users'
    },
    {
      name: 'Recent Records',
      query: 'SELECT * FROM users ORDER BY created_at DESC LIMIT 20'
    },
    {
      name: 'Group By Count',
      query: 'SELECT status, COUNT(*) as count FROM users GROUP BY status'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Query Builder</h1>
        <p className="text-muted-foreground">
          Execute SQL queries against your databases
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

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-900">
          Use caution when running write queries. Always test in a non-production environment first.
        </AlertDescription>
      </Alert>

      {/* Query Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Database</label>
                <select
                  value={selectedDatabase}
                  onChange={(e) => setSelectedDatabase(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a database...</option>
                  {databases.map(db => (
                    <option key={db._id} value={db._id}>
                      {db.name} ({db.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">SQL Query</label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  placeholder="SELECT * FROM users LIMIT 10"
                  className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleExecuteQuery}
                  disabled={loading || !selectedDatabase}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  {loading ? 'Executing...' : 'Execute Query'}
                </Button>
                <Button
                  onClick={handleCopyQuery}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>

              {executionTime && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Query executed in <strong>{executionTime}ms</strong>
                    {results?.duration && (
                      <span> (Server: {results.duration}ms)</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Query Results */}
          {results && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Results ({results.rows.length} rows)</CardTitle>
                <Button
                  onClick={handleDownloadResults}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent>
                {!results.rows || results.rows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No results</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          {Object.keys(results.rows[0] || {}).map(key => (
                            <th key={key} className="text-left py-2 px-4 font-semibold">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            {Object.values(row).map((value, cidx) => (
                              <td key={cidx} className="py-2 px-4 font-mono text-xs">
                                {value === null ? 'NULL' : typeof value === 'string' ? value : JSON.stringify(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Templates & Tips */}
        <div className="space-y-4">
          {/* Query Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Query Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(template.query)}
                  className="w-full text-left p-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-semibold">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {template.query.substring(0, 30)}...
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Query Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">Performance:</p>
                <p>• Always use LIMIT to prevent large result sets</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Safety:</p>
                <p>• Test queries in dev/staging first</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Transactions:</p>
                <p>• Wrap writes in transactions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
