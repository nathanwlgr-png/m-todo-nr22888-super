import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export default function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  loading = false,
  variant = 'outline',
  className = ''
}) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 h-12 px-4 rounded-xl transition-all active:scale-95 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span className="font-medium">{label}</span>
    </Button>
  );
}