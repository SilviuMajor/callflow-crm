import { cn } from '@/lib/utils';

export type PlaceholderCategory = 'contact' | 'custom_contact' | 'seller';

interface PlaceholderBadgeProps {
  name: string;
  category: PlaceholderCategory;
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
        'inline-flex items-center px-2 py-0.5 text-xs font-mono rounded border cursor-pointer transition-colors select-none',
        categoryStyles[category],
        className
      )}
    >
      {`{${name}}`}
    </span>
  );
}
