'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsLayout({ children }) {
  const pathname = usePathname();

  const analyticsPages = [
    { label: 'Cost', href: '/admin/analytics/cost', icon: '💰' },
    { label: 'Performance', href: '/admin/analytics/performance', icon: '⚡' },
    { label: 'Compliance', href: '/admin/analytics/compliance', icon: '✓' },
    { label: 'Security', href: '/admin/analytics/security', icon: '🔒' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="space-y-6 p-6">
      {/* Analytics Navigation */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Analytics Dashboards</h2>
        <div className="flex gap-3 flex-wrap">
          {analyticsPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive(page.href)
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{page.icon}</span>
              <span className="font-medium">{page.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
