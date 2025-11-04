import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface BaseNodeProps {
  data: any;
  selected: boolean;
  icon: LucideIcon;
  defaultColor: string;
  children?: ReactNode;
}

export function BaseNode({ data, selected, icon: Icon, defaultColor, children }: BaseNodeProps) {
  const color = data.color || defaultColor;
  const glowColor = data.glow_color || color;

  return (
    <div
      className="relative px-4 py-3 rounded-lg border-2 transition-all duration-300 cursor-pointer group"
      style={{
        borderColor: color,
        backgroundColor: `${color}10`,
        boxShadow: selected
          ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}80, inset 0 0 20px ${glowColor}40`
          : `0 0 15px ${glowColor}80, inset 0 0 10px ${glowColor}20`,
      }}
      onClick={() => data.onEdit?.()}
    >
      {/* Glow background */}
      <div
        className="absolute inset-0 rounded-lg opacity-20 blur-xl -z-10 animate-glow-pulse"
        style={{ backgroundColor: glowColor }}
      />

      {/* Content */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-md"
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-sm truncate"
            style={{ color }}
          >
            {data.title}
          </div>
          {data.description && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* Hover effect */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `0 0 40px ${glowColor}, inset 0 0 20px ${glowColor}40`,
        }}
      />

      {children}
    </div>
  );
}
