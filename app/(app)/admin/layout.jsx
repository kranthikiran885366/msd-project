'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Users, Zap, BarChart3, Shield, AlertCircle, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: BarChart3 },
    { label: 'System Health', href: '/admin/monitoring', icon: AlertCircle },
    { label: 'API & SDKs', href: '/admin/api', icon: Zap },
    { label: 'Team & Permissions', href: '/admin/team', icon: Users },
    { label: 'Audit & Compliance', href: '/admin/audit', icon: Shield },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0 lg:static z-40`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Admin</h1>
              <Badge className="mt-1">v1.0.0</Badge>
            </div>
            <button className="lg:hidden" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.label === 'System Health' && (
                    <Badge className="ml-auto bg-yellow-100 text-yellow-800 text-xs">1</Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button variant="outline" className="w-full">
              Documentation
            </Button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Admin Panel v1.0.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-semibold text-gray-900">
                {navItems.find((item) => isActive(item.href))?.label || 'Administration'}
              </h2>
              <p className="text-xs text-gray-500">Manage your deployment platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button size="sm" variant="outline">
              Help & Support
            </Button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
              SC
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
