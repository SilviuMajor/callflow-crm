import { PlaceholderBadge, type PlaceholderCategory } from './PlaceholderBadge';

interface PlaceholderGroup {
  label: string;
  category: PlaceholderCategory;
  placeholders: { name: string; description?: string }[];
}

interface PlaceholderToolbarProps {
  groups: PlaceholderGroup[];
  onInsert: (placeholder: string) => void;
  onDragStart?: (placeholder: string, e: React.DragEvent) => void;
  emptyFields?: Set<string>;
}

export function PlaceholderToolbar({ groups, onInsert, onDragStart, emptyFields }: PlaceholderToolbarProps) {
  return (
    <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Click or drag placeholders into your prompt:
      </div>
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <div className="text-xs text-muted-foreground font-medium">{group.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {group.placeholders.map((p) => (
              <PlaceholderBadge
                key={p.name}
                name={p.name}
                category={group.category}
                isEmpty={emptyFields?.has(p.name)}
                onClick={() => onInsert(`{${p.name}}`)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', `{${p.name}}`);
                  onDragStart?.(`{${p.name}}`, e);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
