'use client';

import type { HeatmapCell } from '@/types/social';
import { useState } from 'react';

const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);

interface Props {
  data: HeatmapCell[];
}

export function EngagementHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ day: number; hour: number; value: number; x: number; y: number } | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getCell = (day: number, hour: number) => {
    return data.find((d) => d.day === day && d.hour === hour);
  };

  return (
    <div className="glass-card rounded-2xl p-5 h-full">
      <h3 className="text-white font-semibold mb-4">Engagement Heatmap</h3>
      <div className="relative overflow-auto">
        {/* Hours header */}
        <div className="flex ml-10 mb-1">
          {hourLabels.filter((_, i) => i % 3 === 0).map((label, i) => (
            <div key={i} className="text-[9px] text-white/30" style={{ width: '36px' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="space-y-[2px]">
          {dayLabels.map((dayLabel, day) => (
            <div key={day} className="flex items-center gap-1">
              <span className="text-[10px] text-white/30 w-8 text-right">{dayLabel}</span>
              <div className="flex gap-[2px]">
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = getCell(day, hour);
                  const value = cell?.value ?? 0;
                  const intensity = value / maxValue;
                  return (
                    <div
                      key={hour}
                      className="w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-all hover:scale-150 hover:z-10"
                      style={{
                        backgroundColor: intensity > 0
                          ? `rgba(139, 92, 246, ${0.1 + intensity * 0.9})`
                          : 'rgba(255,255,255,0.03)',
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ day, hour, value, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-[#12121A] border border-white/10 rounded-lg px-3 py-2 text-xs pointer-events-none"
            style={{ left: tooltip.x + 16, top: tooltip.y - 40 }}
          >
            <span className="text-white/60">
              {dayLabels[tooltip.day]} {tooltip.hour}h
            </span>
            <span className="text-white font-bold ml-2">{tooltip.value.toFixed(1)}%</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-10">
          <span className="text-[9px] text-white/30">Moins</span>
          <div className="flex gap-[2px]">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
              <div
                key={opacity}
                className="w-[10px] h-[10px] rounded-[2px]"
                style={{ backgroundColor: `rgba(139, 92, 246, ${opacity})` }}
              />
            ))}
          </div>
          <span className="text-[9px] text-white/30">Plus</span>
        </div>
      </div>
    </div>
  );
}
