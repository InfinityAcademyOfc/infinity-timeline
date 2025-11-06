import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineDate {
  date: Date;
  position: number; // position in pixels
}

interface DraggableTimelineProps {
  dates: Date[];
  onDatePositionsChange?: (positions: number[]) => void;
}

export function DraggableTimeline({ dates, onDatePositionsChange }: DraggableTimelineProps) {
  const [timelineDates, setTimelineDates] = useState<TimelineDate[]>(
    dates.map((date, index) => ({
      date,
      position: (index / Math.max(dates.length - 1, 1)) * 100,
    }))
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingIndex === null) return;

      const container = document.getElementById('timeline-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newPosition = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));

      setTimelineDates((prev) => {
        const newDates = [...prev];
        
        // Ensure dates don't overlap or cross each other
        const prevDate = prev[draggingIndex - 1];
        const nextDate = prev[draggingIndex + 1];
        
        let constrainedPosition = newPosition;
        if (prevDate && newPosition <= prevDate.position + 2) {
          constrainedPosition = prevDate.position + 2;
        }
        if (nextDate && newPosition >= nextDate.position - 2) {
          constrainedPosition = nextDate.position - 2;
        }

        newDates[draggingIndex] = {
          ...newDates[draggingIndex],
          position: constrainedPosition,
        };

        return newDates;
      });
    },
    [draggingIndex]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingIndex !== null) {
      // Notify parent of position changes
      if (onDatePositionsChange) {
        onDatePositionsChange(timelineDates.map(d => d.position));
      }
      setDraggingIndex(null);
    }
  }, [draggingIndex, timelineDates, onDatePositionsChange]);

  // Add/remove event listeners
  useEffect(() => {
    if (draggingIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingIndex, handleMouseMove, handleMouseUp]);

  return (
    <div 
      id="timeline-container"
      className="absolute top-0 left-0 right-0 z-10 h-20 bg-gradient-to-b from-background/95 to-transparent pointer-events-none"
    >
      <div className="relative h-full px-4">
        {timelineDates.map((timelineDate, index) => (
          <div
            key={index}
            className={cn(
              "absolute top-2 transform -translate-x-1/2 pointer-events-auto cursor-grab",
              "transition-all duration-150",
              draggingIndex === index && "cursor-grabbing scale-110 z-10"
            )}
            style={{ left: `${timelineDate.position}%` }}
            onMouseDown={handleMouseDown(index)}
          >
            <div className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg",
              "bg-card/80 backdrop-blur-sm border border-primary/30",
              "hover:bg-card hover:border-primary/50 transition-all",
              "shadow-lg hover:shadow-glow"
            )}>
              <div className="flex items-center gap-1">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {format(timelineDate.date, 'MMM yyyy', { locale: ptBR })}
              </span>
            </div>
            
            {/* Visual connection line */}
            {index < timelineDates.length - 1 && (
              <div 
                className="absolute top-1/2 left-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent"
                style={{ 
                  width: `${(timelineDates[index + 1].position - timelineDate.position) * window.innerWidth / 100}px` 
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
