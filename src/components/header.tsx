'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, ShieldAlert, User } from 'lucide-react';
import { clearAdminAuth, getStoredAdmin } from '@/lib/auth';
import { Button } from './ui/button';
import { AdminNotificationDropdown } from './AdminNotificationDropdown';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  title: string;
}

export function Header({ onOpenMobileSidebar, title }: HeaderProps) {
  const router = useRouter();
  const admin = getStoredAdmin();

  const handleLogout = () => {
    clearAdminAuth();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-muted hover:text-white rounded-lg hover:bg-surface-elevated transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">{title}</h1>
      </div>

      {/* Right: Current Admin & Logout */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-muted">SuperAdmin:</span>
          <span className="font-semibold text-slate-200">{admin?.email || 'superadmin@elijah.ai'}</span>
        </div>

        {/* SuperAdmin Platform Alerts Notification Bell */}
        <AdminNotificationDropdown />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-subtle hover:text-danger hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}

