'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2, X } from 'lucide-react';

interface Props {
  title: string;
  children: React.ReactNode;
  /** Render function for the expanded view (gets more height) */
  expandedContent?: React.ReactNode;
  className?: string;
}

export function ExpandableChart({ title, children, expandedContent, className = '' }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className={`glass-card rounded-2xl p-5 relative group ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">{title}</h3>
          <button
            onClick={() => setExpanded(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
            title="Agrandir"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="bg-[#12121A] border-white/10 text-white sm:max-w-[90vw] h-[85vh] flex flex-col" showCloseButton={false}>
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <button
              onClick={() => setExpanded(false)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {expandedContent || children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
