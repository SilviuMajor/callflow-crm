import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, GripVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface AIBlockEditorProps {
  instruction: string;
  onChange: (instruction: string) => void;
  onDelete: () => void;
  index: number;
}

export function AIBlockEditor({ instruction, onChange, onDelete, index }: AIBlockEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Truncate instruction for collapsed view
  const truncatedInstruction = instruction.length > 60 
    ? instruction.slice(0, 60) + '...' 
    : instruction;

  return (
    <div className="rounded-lg border-2 border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical className="h-4 w-4 text-amber-600/50 cursor-grab" />
        <Sparkles className="h-4 w-4 text-amber-600" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          AI Block {index + 1}
        </span>
        <span className="flex-1 text-xs text-amber-600/70 dark:text-amber-500/70 truncate ml-2">
          {!isExpanded && truncatedInstruction}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-amber-600 hover:text-red-500 hover:bg-red-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-amber-600" />
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <Textarea
            value={instruction}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe what the AI should generate here..."
            className="min-h-[80px] text-sm bg-white dark:bg-background border-amber-300 focus:border-amber-500"
          />
          <p className="text-xs text-amber-600/70 mt-1.5">
            Use placeholders like {'{first_name}'}, {'{company_research}'} within your instruction.
          </p>
        </div>
      )}
    </div>
  );
}

interface AIBlockBadgeProps {
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export function AIBlockBadge({ onClick, onDragStart }: AIBlockBadgeProps) {
  return (
    <span
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border cursor-pointer transition-colors select-none',
        'bg-amber-100 text-amber-700 border-amber-400 hover:bg-amber-200',
        'dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-600 dark:hover:bg-amber-800/50'
      )}
    >
      <Sparkles className="h-3 w-3" />
      + AI Block
    </span>
  );
}
