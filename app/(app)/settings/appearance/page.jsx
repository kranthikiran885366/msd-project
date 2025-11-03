'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Sun, Globe, Type } from 'lucide-react';

export default function AppearancePage() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState('medium');
  const [compact, setCompact] = useState(false);
  const [colorScheme, setColorScheme] = useState('blue');

  const themes = [
    { id: 'light', name: 'Light', icon: Sun, description: 'Bright and clean' },
    { id: 'dark', name: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { id: 'auto', name: 'Auto', icon: 'auto', description: 'Follow system' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
  ];

  const fontSizes = [
    { id: 'small', name: 'Small', px: '12px' },
    { id: 'medium', name: 'Medium (Default)', px: '14px' },
    { id: 'large', name: 'Large', px: '16px' },
    { id: 'xlarge', name: 'Extra Large', px: '18px' },
  ];

  const colors = [
    { id: 'blue', name: 'Blue', hex: '#3b82f6' },
    { id: 'purple', name: 'Purple', hex: '#8b5cf6' },
    { id: 'green', name: 'Green', hex: '#10b981' },
    { id: 'red', name: 'Red', hex: '#ef4444' },
    { id: 'orange', name: 'Orange', hex: '#f97316' },
    { id: 'pink', name: 'Pink', hex: '#ec4899' },
  ];

  const timezones = [
    'UTC-8 (PST)',
    'UTC-5 (EST)',
    'UTC+0 (UTC)',
    'UTC+1 (CET)',
    'UTC+5:30 (IST)',
    'UTC+8 (SGT)',
    'UTC+9 (JST)',
  ];

  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Appearance & Preferences</h1>
        <p className="text-gray-600">Customize how the platform looks and feels</p>
      </div>

      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="language">Language & Region</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Color Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {themes.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      theme === t.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {t.id === 'auto' ? '🔄' : <t.icon className="w-6 h-6" />}
                    </div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-gray-600">{t.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accent Color */}
          <Card>
            <CardHeader>
              <CardTitle>Accent Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    onClick={() => setColorScheme(color.id)}
                    className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                      colorScheme === color.id
                        ? 'border-gray-900'
                        : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor: color.hex,
                      opacity: colorScheme === color.id ? 1 : 0.7,
                    }}
                  >
                    <p className="text-white text-xs font-medium">{color.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} border`}>
                <h3 className="font-semibold mb-2">Sample Content</h3>
                <p className="text-sm mb-3">This is how your content will look with the selected theme and colors.</p>
                <Button style={{ backgroundColor: colors.find(c => c.id === colorScheme)?.hex }}>
                  Sample Button
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language & Region Tab */}
        <TabsContent value="language" className="space-y-4">
          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" /> Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-3"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                Note: Changing language will reload the page.
              </p>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <CardTitle>Timezone</CardTitle>
            </CardHeader>
            <CardContent>
              <select className="w-full px-4 py-2 border rounded-lg" defaultValue="UTC-5 (EST)">
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Date Format */}
          <Card>
            <CardHeader>
              <CardTitle>Date Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dateFormats.map((format) => (
                <div key={format} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="dateFormat" id={format} className="w-4 h-4" />
                  <label htmlFor={format} className="text-sm flex-1 cursor-pointer">
                    {format}
                  </label>
                  <span className="text-xs text-gray-600">
                    {new Date().toLocaleDateString(language === 'en' ? 'en-US' : language, {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" /> Font Size
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fontSizes.map((size) => (
                <div
                  key={size.id}
                  onClick={() => setFontSize(size.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    fontSize === size.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  style={{ fontSize: size.px }}
                >
                  <p className="font-medium">{size.name}</p>
                  <p className="text-xs text-gray-600">Sample text at {size.px}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compact Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-gray-600">Reduce spacing and sizes</p>
                </div>
                <button
                  onClick={() => setCompact(!compact)}
                  className={`px-4 py-2 rounded transition ${
                    compact
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {compact ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Show Animations</p>
                  <p className="text-sm text-gray-600">Enable smooth transitions</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Reduce Motion</p>
                  <p className="text-sm text-gray-600">Minimize animated elements</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Code Editor Theme */}
          <Card>
            <CardHeader>
              <CardTitle>Code Editor Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {['Dracula', 'One Dark', 'Light+', 'Monokai'].map((editor) => (
                  <button
                    key={editor}
                    className="p-3 border rounded hover:bg-gray-50 text-left"
                  >
                    <p className="font-medium text-sm">{editor}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {editor === 'Dracula' && 'Dark theme inspired by Dracula'}
                      {editor === 'One Dark' && 'High contrast dark theme'}
                      {editor === 'Light+' && 'Bright and clean theme'}
                      {editor === 'Monokai' && 'Classic code theme'}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accessibility */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <label className="text-sm font-medium">High Contrast Mode</label>
                <input type="checkbox" className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <label className="text-sm font-medium">Keyboard Navigation</label>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <label className="text-sm font-medium">Screen Reader Support</label>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button className="flex-1">Save Preferences</Button>
        <Button variant="outline" className="flex-1">Reset to Defaults</Button>
      </div>
    </div>
  );
}
