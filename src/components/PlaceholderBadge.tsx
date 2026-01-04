import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type PlaceholderCategory = 'contact' | 'custom_contact' | 'seller';

interface PlaceholderBadgeProps {
  name: string;
  category: PlaceholderCategory;
  isEmpty?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
}

const categoryStyles: Record<PlaceholderCategory, string> = {
  contact: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
  custom_contact: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
  seller: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
};

export function PlaceholderBadge({ 
  name, 
  category, 
  isEmpty = false,
  onClick, 
  onDragStart,
  className 
}: PlaceholderBadgeProps) {
  return (
    <span
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-mono rounded border cursor-pointer transition-colors select-none relative',
        categoryStyles[category],
        className
      )}
    >
      {`{${name}}`}
      {isEmpty && (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-destructive rounded-full flex items-center justify-center">
          <X className="w-2.5 h-2.5 text-destructive-foreground" />
        </span>
      )}
    </span>
  );
}
