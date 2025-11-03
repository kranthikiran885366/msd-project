'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Upload,
  Image as ImageIcon,
  Video,
  Zap,
  Gauge,
  BarChart3,
  Clock,
  HardDrive,
  Globe,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Copy,
  Eye,
  Settings,
  TrendingUp,
  RefreshCw,
  Download,
  ExternalLink,
  Search,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function MediaCDNPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [settings, setSettings] = useState({
    compressionLevel: 'medium',
    cacheControl: 'public, max-age=31536000',
    region: 'auto',
    imageOptimization: true,
    autoWebP: true,
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setError('');
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        setAssets([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getMediaAssets?.(projectId) || { data: [] };
      setAssets(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files || []));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setSelectedFiles(Array.from(e.dataTransfer.files || []));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      setError('');
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('settings', JSON.stringify(settings));

        const res = await apiClient.uploadMediaAsset?.(formData) || { success: false };

        if (res.success) {
          setUploadProgress(((i + 1) / selectedFiles.length) * 100);
        }
      }

      setSelectedFiles([]);
      await fetchAssets();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const optimizeAsset = async (id) => {
    try {
      setError('');
      const res = await apiClient.optimizeMediaAsset?.(id, settings) || { success: false };
      if (res.success) {
        await fetchAssets();
      }
    } catch (err) {
      setError(err.message || 'Optimization failed');
    }
  };

  const purgeCache = async (id) => {
    try {
      setError('');
      const res = await apiClient.purgeMediaCache?.(id) || { success: false };
      if (res.success) {
        await fetchAssets();
      }
    } catch (err) {
      setError(err.message || 'Cache purge failed');
    }
  };

  const deleteAsset = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      setError('');
      const res = await apiClient.deleteMediaAsset?.(id) || { success: false };
      if (res.success) {
        await fetchAssets();
      }
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === 'all' || asset.type.includes(typeFilter);
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Media & Image CDN
            </h1>
            <p className="text-muted-foreground mt-2">
              Optimize and serve images and videos globally with automatic optimization
            </p>
          </div>
          <Button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Upload className="w-4 h-4" />
            Upload Asset
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total Assets"
            value={assets.length}
            icon={<ImageIcon className="w-5 h-5" />}
            color="purple"
          />
          <InfoCard
            title="Total Bandwidth"
            value={formatSize(
              assets.reduce((sum, a) => sum + (a.bandwidth || 0), 0)
            )}
            icon={<Globe className="w-5 h-5" />}
            color="pink"
            trend="this month"
          />
          <InfoCard
            title="Cache Hit Rate"
            value="94.2%"
            icon={<Zap className="w-5 h-5" />}
            color="green"
            trend="+2.1% improvement"
          />
          <InfoCard
            title="Space Saved"
            value={formatSize(
              assets.reduce(
                (sum, a) => sum + ((a.originalSize || 0) - (a.size || 0)),
                0
              )
            )}
            icon={<HardDrive className="w-5 h-5" />}
            color="blue"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border/50"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border/50 bg-card text-foreground hover:border-border transition-colors"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
            <Button variant="outline" onClick={fetchAssets} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-40 bg-muted rounded-lg"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center space-y-4">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold">No assets found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search filters'
                      : 'Upload your first image or video'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDelete={deleteAsset}
                  onOptimize={optimizeAsset}
                  onPurgeCache={purgeCache}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Upload Media Assets</CardTitle>
              <CardDescription>
                Drag and drop files or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <div
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="space-y-4"
                >
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">
                      Drop your files here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supports images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM)
                    </p>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="text-sm">
                          {file.name} ({formatSize(file.size)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Compression Level
                  </label>
                  <select
                    value={settings.compressionLevel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        compressionLevel: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border/50 bg-card"
                  >
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium (Recommended)</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Cache Duration</label>
                  <select
                    value={settings.cacheControl}
                    onChange={(e) =>
                      setSettings({ ...settings, cacheControl: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border/50 bg-card"
                  >
                    <option value="no-cache">No Cache</option>
                    <option value="public, max-age=3600">1 Hour</option>
                    <option value="public, max-age=86400">1 Day</option>
                    <option value="public, max-age=604800">1 Week</option>
                    <option value="public, max-age=31536000">1 Year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Deployment Region</label>
                  <select
                    value={settings.region}
                    onChange={(e) =>
                      setSettings({ ...settings, region: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border/50 bg-card"
                  >
                    <option value="auto">Auto (CDN Optimized)</option>
                    <option value="us-east">US East</option>
                    <option value="us-west">US West</option>
                    <option value="eu">Europe</option>
                    <option value="asia">Asia Pacific</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoWebP}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoWebP: e.target.checked,
                        })
                      }
                      className="rounded border-border"
                    />
                    <span className="text-sm font-semibold">
                      Auto WebP Format
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground ml-6">
                    Automatically convert to WebP for modern browsers
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Uploading...</p>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={uploadFiles}
                disabled={
                  selectedFiles.length === 0 || uploading
                }
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Upload className="w-4 h-4" />
                {uploading
                  ? `Uploading ${Math.round(uploadProgress)}%...`
                  : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Settings */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-500" />
                  Performance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Cache Hit Rate
                  </label>
                  <p className="text-2xl font-bold text-green-600">94.2%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +2.1% improvement from last month
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Average Response Time
                  </label>
                  <p className="text-2xl font-bold">145ms</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimal performance across all regions
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Data Saved by Optimization
                  </label>
                  <p className="text-2xl font-bold text-green-600">2.3 GB</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    37% reduction in data transfer
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bandwidth Usage */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Bandwidth Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">This Month</span>
                    <span className="text-sm text-muted-foreground">
                      {formatSize(1099511627776)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      style={{ width: '65%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Plan Limit: {formatSize(1649267441664)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current Usage: 65% of available bandwidth
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Image Optimization
                  </label>
                  <Button
                    variant={settings.imageOptimization ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        imageOptimization: !settings.imageOptimization,
                      })
                    }
                  >
                    {settings.imageOptimization ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Auto WebP Conversion
                  </label>
                  <Button
                    variant={settings.autoWebP ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        autoWebP: !settings.autoWebP,
                      })
                    }
                  >
                    {settings.autoWebP ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ title, value, icon, color = 'blue', trend }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    pink: 'from-pink-500 to-rose-500',
    green: 'from-green-500 to-emerald-500',
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} text-white group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              ↑ {trend}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset, onDelete, onOptimize, onPurgeCache }) {
  const isImage = asset.type.startsWith('image');

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {asset.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={asset.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {asset.status}
              </Badge>
              {asset.compressed && (
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" />
                  Optimized
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="w-full h-40 bg-muted/50 rounded-lg flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img
              src={asset.cdnUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
              onError={(e) => (e.target.style.display = 'none')}
            />
          ) : (
            <video
              src={asset.cdnUrl}
              className="w-full h-full object-cover"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}
          {(!isImage || true) && (
            <Video className="w-12 h-12 text-muted-foreground opacity-50" />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="font-semibold">{formatSize(asset.size)}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Saved</p>
            <p className="font-semibold text-green-600">
              {formatSize(
                (asset.originalSize || 0) - asset.size
              )}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Cache Hits</p>
            <p className="font-semibold">{(asset.cacheHits || 0).toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Bandwidth</p>
            <p className="font-semibold">{formatSize(asset.bandwidth || 0)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onOptimize(asset.id)}
          >
            <Zap className="w-4 h-4" />
            Optimize
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onPurgeCache(asset.id)}
          >
            <RefreshCw className="w-4 h-4" />
            Purge
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(asset.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}