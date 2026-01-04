import { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, Copy, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AIResearchBoxProps {
  title: string;
  content: string | null | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated?: string | null;
  citations?: string[];
  variant?: 'company' | 'custom' | 'persona';
  buttonLabel?: string;
  provider?: 'perplexity' | 'openai' | null;
  maxCollapsedLines?: number;
}

export function AIResearchBox({
  title,
  content,
  isLoading,
  onRefresh,
  lastUpdated,
  citations,
  variant = 'company',
  buttonLabel = 'Refresh',
  provider,
  maxCollapsedLines = 5,
}: AIResearchBoxProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content exceeds max lines
  useEffect(() => {
    if (contentRef.current && content) {
      const lineHeight = 24; // approximate line height for text-sm leading-relaxed
      const maxHeight = lineHeight * maxCollapsedLines;
      setShowReadMore(contentRef.current.scrollHeight > maxHeight + 10);
    }
  }, [content, maxCollapsedLines, isExpanded]);

  const copyToClipboard = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    }
  };

  const variantStyles = {
    company: 'border-blue-500/30 bg-blue-500/5',
    custom: 'border-purple-500/30 bg-purple-500/5',
    persona: 'border-emerald-500/30 bg-emerald-500/5',
  };

  const iconStyles = {
    company: 'text-blue-500',
    custom: 'text-purple-500',
    persona: 'text-emerald-500',
  };

  return (
    <div className={cn(
      'rounded-lg border-2 overflow-hidden transition-all',
      variantStyles[variant]
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={cn('h-4 w-4', iconStyles[variant])} />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(lastUpdated), 'MMM d, HH:mm')}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : content ? (
            <>
              <div 
                ref={contentRef}
                className={cn(
                  "text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed overflow-hidden transition-all",
                  !isContentExpanded && showReadMore && "max-h-[120px]"
                )}
              >
                {content}
              </div>
              
              {showReadMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsContentExpanded(!isContentExpanded);
                  }}
                  className="text-xs text-primary hover:underline mt-1 font-medium"
                >
                  {isContentExpanded ? 'Show less' : 'Read more...'}
                </button>
              )}
              
              {citations && citations.length > 0 ? (
                <div className="mt-3 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {citations.slice(0, 3).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {new URL(url).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              ) : provider === 'openai' ? (
                <div className="mt-3 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Generated by ChatGPT (no web citations)
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No research available. Click "{buttonLabel}" to generate.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={isLoading}
              className="h-7 text-xs"
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', isLoading && 'animate-spin')} />
              {content ? buttonLabel : 'Generate'}
            </Button>
            {content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
                className="h-7 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
