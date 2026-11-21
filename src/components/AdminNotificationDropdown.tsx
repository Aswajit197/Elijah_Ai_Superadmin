'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  CheckCheck,
  Building2,
  UserCheck,
  Mail,
  ShieldAlert,
  AlertTriangle,
  Server,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  tenantId?: string | null;
  tenantSlug?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function AdminNotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL'>('ALL');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest<{ notifications: AdminNotification[]; unreadCount: number }>(
        '/super/notifications?limit=25'
      );
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount ?? 0);
      }
    } catch (err) {
      // Silently fail if not logged in or backend temporarily unreachable
      console.debug('SuperAdmin notification fetch error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiRequest(`/super/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await apiRequest('/super/notifications/read-all', { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark all alerts read:', err);
    }
  };

  const handleItemClick = (n: AdminNotification) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    const targetLink = n.link || '/tenants';
    setIsOpen(false);
    router.push(targetLink);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'CRITICAL') return n.severity === 'CRITICAL' || n.severity === 'WARNING';
    return true;
  });

  const getAlertBadge = (type: string, severity: string) => {
    if (severity === 'CRITICAL') {
      return {
        icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
        label: 'CRITICAL',
      };
    }
    if (severity === 'WARNING' || type === 'USAGE_QUOTA_ALERT') {
      return {
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'QUOTA ALERT',
      };
    }
    if (type === 'TENANT_CREATED') {
      return {
        icon: <Building2 className="w-3.5 h-3.5 text-purple-400" />,
        badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        label: 'NEW TENANT',
      };
    }
    if (type === 'INVITE_ACCEPTED') {
      return {
        icon: <UserCheck className="w-3.5 h-3.5 text-emerald-400" />,
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        label: 'OWNER ACTIVATED',
      };
    }
    if (type === 'INVITE_RESENT') {
      return {
        icon: <Mail className="w-3.5 h-3.5 text-sky-400" />,
        badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        label: 'INVITE RESENT',
      };
    }
    return {
      icon: <Server className="w-3.5 h-3.5 text-slate-400" />,
      badgeClass: 'bg-surface-elevated text-slate-300 border-border',
      label: 'PLATFORM',
    };
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const hasCriticalUnread = notifications.some(
    (n) => !n.isRead && (n.severity === 'CRITICAL' || n.severity === 'WARNING')
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-muted hover:text-white hover:bg-surface-elevated transition-colors"
        title="SuperAdmin Platform Alerts"
        aria-label="Platform Alerts"
      >
        <Bell className="w-4 h-4" />

        {unreadCount > 0 && (
          <>
            {hasCriticalUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
            <span
              className={`absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold font-mono rounded-full border shadow-sm ${
                hasCriticalUnread
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-purple-600 text-white border-purple-400'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0F1422]/95 backdrop-blur-2xl border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-surface-elevated/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">Platform Alerts</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
                title="Mark all alerts as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/60 bg-surface/50 text-xs">
            {(['ALL', 'UNREAD', 'CRITICAL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                  filter === tab
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'UNREAD' ? 'Unread' : 'Critical 🚨'}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-slate-500">
                  <BellOff className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">No platform alerts</p>
                <p className="text-[11px] text-muted max-w-[200px]">
                  All tenants, AI voice gateways, and workflow nodes are operating normally.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const { icon, badgeClass, label } = getAlertBadge(n.type, n.severity);
                const isCritical = n.severity === 'CRITICAL' || n.severity === 'WARNING';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 hover:bg-surface-elevated/70 transition-all cursor-pointer relative group flex gap-3 ${
                      !n.isRead ? 'bg-purple-500/5' : ''
                    }`}
                  >
                    {!n.isRead && (
                      <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-purple-500" />
                    )}

                    <div className="shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-border/80 flex items-center justify-center">
                        {icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}
                        >
                          {label}
                        </span>
                        <span className="text-[10px] text-muted whitespace-nowrap">
                          {getRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <h4
                        className={`text-xs font-semibold truncate ${
                          isCritical ? 'text-amber-300 font-bold' : !n.isRead ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {n.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-purple-400 hover:text-white transition-colors">
                        <span>View in Tenants</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-surface-elevated/40 border-t border-border/70 flex items-center justify-between text-[11px] text-muted">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Elijah Multi-Tenant Health Feed</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/tenants');
              }}
              className="text-[10px] font-semibold text-purple-400 hover:text-white transition-colors"
            >
              All Companies →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
