import React from 'react';
import NotificationSettings from '@/components/notifications/NotificationSettings';

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <NotificationSettings />
      </div>
    </div>
  );
}