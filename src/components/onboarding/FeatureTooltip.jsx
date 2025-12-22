import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function FeatureTooltip({ 
  title, 
  description, 
  children,
  icon: Icon = HelpCircle,
  position = "top"
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors">
          <Icon className="w-3 h-3 text-indigo-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side={position}
        className="w-80 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-indigo-900">{title}</h4>
          <button
            onClick={() => setOpen(false)}
            className="p-0.5 hover:bg-indigo-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {description}
        </p>
        {children}
      </PopoverContent>
    </Popover>
  );
}