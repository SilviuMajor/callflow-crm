interface MobilePanelIndicatorProps {
  activeIndex: number;
  total: number;
  labels: string[];
  onSelect: (index: number) => void;
}

export function MobilePanelIndicator({ activeIndex, total, labels, onSelect }: MobilePanelIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-2 bg-card border-t border-border">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className="flex flex-col items-center gap-1"
        >
          <span className={`text-xs font-medium transition-colors ${
            index === activeIndex ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {labels[index]}
          </span>
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex 
                ? 'bg-primary scale-110' 
                : 'bg-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
