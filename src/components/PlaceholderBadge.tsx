import { cn, getSellerFieldColorClasses } from '@/lib/utils';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type PlaceholderCategory = 'contact' | 'custom_contact' | 'seller' | 'ai_research';

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
  seller: '', // Seller uses per-field colors
  ai_research: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600',
};

export function PlaceholderBadge({ 
  name, 
  category, 
  isEmpty = false,
  onClick, 
  onDragStart,
  className 
}: PlaceholderBadgeProps) {
  // For seller category, use per-field colors; otherwise use category styles
  const colorClasses = category === 'seller' 
    ? getSellerFieldColorClasses(name) 
    : categoryStyles[category];

  return (
    <span
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-mono rounded border cursor-pointer transition-colors select-none relative',
        colorClasses,
        className
      )}
    >
      {`{${name}}`}
      {isEmpty && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-destructive rounded-full flex items-center justify-center cursor-help">
              <X className="w-2.5 h-2.5 text-destructive-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Empty field
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
