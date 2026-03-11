import { useState, useRef, useEffect, forwardRef } from 'react';
import { Sparkles, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';

interface AIResearchBoxProps {
  title: string;
  content: string | null | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated?: string | null;
  citations?: string[];
  variant?: 'company' | 'custom' | 'persona' | 'script';
  buttonLabel?: string;
  provider?: 'perplexity' | 'openai' | 'anthropic' | null;
  maxCollapsedLines?: number;
  disabled?: boolean;
  disabledReason?: string;
}

export const AIResearchBox = forwardRef<HTMLDivElement, AIResearchBoxProps>(
  function AIResearchBox({
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
    disabled = false,
    disabledReason,
  }, ref) {
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && content) {
      const lineHeight = 24;
      const maxHeight = lineHeight * maxCollapsedLines;
      setShowReadMore(contentRef.current.scrollHeight > maxHeight + 10);
    }
  }, [content, maxCollapsedLines]);

  const copyToClipboard = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    }
  };

  const variantStyles = {
    company: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', accent: 'text-blue-500', pill: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    custom:  { bg: 'bg-purple-500/5', border: 'border-purple-500/20', accent: 'text-purple-500', pill: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
    persona: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', accent: 'text-emerald-500', pill: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    script:  { bg: 'bg-amber-500/5', border: 'border-amber-500/20', accent: 'text-amber-500', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  };

  const s = variantStyles[variant];

  return (
    <div
      ref={ref}
      className={cn('rounded-lg border overflow-hidden', s.bg, s.border)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMeta(!showMeta); }}
          className={cn(s.accent, 'hover:opacity-70 transition-opacity flex-shrink-0')}
          title="Click for AI details"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
        <span className={cn('text-[11px] font-semibold uppercase tracking-wider flex-1', s.accent)}>
          {title}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              disabled={isLoading}
              className={cn('text-[10px] px-2 py-0.5 rounded font-medium transition-opacity flex items-center gap-1', s.pill, isLoading && 'opacity-50')}
            >
              <RefreshCw className={cn('h-2.5 w-2.5', isLoading && 'animate-spin')} />
              {isLoading ? 'Loading...' : (content ? buttonLabel : 'Generate')}
            </button>
          )}
          {disabled && disabledReason && (
            <span className="text-[10px] text-muted-foreground italic">{disabledReason}</span>
          )}
          {content && (
            <button
              onClick={(e) => { e.stopPropagation(); copyToClipboard(); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Metadata — hidden by default, toggled by sparkle icon */}
      {showMeta && (lastUpdated || provider) && (
        <div className="px-3 pb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {lastUpdated && <span>Generated: {format(new Date(lastUpdated), 'MMM d, HH:mm')}</span>}
          {provider && <><span>·</span><span>{provider}</span></>}
        </div>
      )}

      {/* Content */}
      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        ) : content ? (
          <>
            <div
              ref={contentRef}
              className={cn(
                'text-sm text-foreground/90 leading-relaxed overflow-hidden transition-all prose prose-sm dark:prose-invert max-w-none',
                !isContentExpanded && showReadMore && 'max-h-[120px]'
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-base font-bold mt-2 mb-1 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-1 first:mt-0">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {showReadMore && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsContentExpanded(!isContentExpanded); }}
                className={cn('text-[11px] font-medium mt-1 hover:underline', s.accent)}
              >
                {isContentExpanded ? 'Show less' : 'Read more...'}
              </button>
            )}

            {citations && citations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {citations.slice(0, 3).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    {new URL(url).hostname}
                  </a>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No data yet. Click "{buttonLabel}" to generate.
          </p>
        )}
      </div>
    </div>
  );
});
