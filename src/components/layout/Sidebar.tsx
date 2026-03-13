'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Brain,
  Dna,
  Upload,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/analytics', label: 'AI Analytics', icon: Brain },
  { href: '/prompt-lab', label: 'Prompt Lab', icon: Dna },
  { href: '/export', label: 'Export', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#12121A] border border-white/10 rounded-lg p-2 text-white/70 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen w-64 bg-[#0A0A0F] border-r border-white/5 flex flex-col z-50 transition-transform duration-300',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center font-bold text-white text-lg">
              T
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">TibTalks</h1>
              <p className="text-white/40 text-xs">Command Center</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-white border border-violet-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-violet-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              TB
            </div>
            <div>
              <p className="text-white text-sm font-medium">TibTalks</p>
              <p className="text-emerald-400/70 text-xs">Live Data</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
