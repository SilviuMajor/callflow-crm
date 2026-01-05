import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn, getSellerFieldColor } from '@/lib/utils';
import { type PlaceholderCategory } from '@/components/PlaceholderBadge';

interface PlaceholderGroup {
  label: string;
  category: PlaceholderCategory;
  placeholders: { name: string; description?: string }[];
}

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholderGroups: PlaceholderGroup[];
  emptyFields?: Set<string>;
  className?: string;
}

const categoryColors: Record<PlaceholderCategory, { bg: string; text: string; border: string }> = {
  contact: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  custom_contact: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  seller: { bg: '', text: '', border: '' }, // Seller uses per-field colors
  ai_research: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  ai_persona: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
};

// Get color classes for a placeholder (handles seller per-field colors)
function getPlaceholderColorClasses(category: PlaceholderCategory, name: string): { bg: string; text: string; border: string } {
  if (category === 'seller') {
    return getSellerFieldColor(name);
  }
  return categoryColors[category];
}

export function PromptEditor({ value, onChange, placeholderGroups, emptyFields, className }: PromptEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteFilter, setAutocompleteFilter] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dragInsertIndex, setDragInsertIndex] = useState<number | null>(null);
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const autocompleteStartPos = useRef<number | null>(null);
  const isUserInputRef = useRef(false);
  const lastValueRef = useRef(value);
  const lastInputTimeRef = useRef<number>(0);
  const lastEmptyFieldsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  // Flatten all placeholders with their category
  const allPlaceholders = useMemo(() => {
    return placeholderGroups.flatMap(group => 
      group.placeholders.map(p => ({ ...p, category: group.category, groupLabel: group.label }))
    );
  }, [placeholderGroups]);

  // Filter placeholders based on autocomplete filter
  const filteredPlaceholders = useMemo(() => {
    if (!autocompleteFilter) return allPlaceholders;
    const lower = autocompleteFilter.toLowerCase();
    return allPlaceholders.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.description?.toLowerCase().includes(lower)
    );
  }, [allPlaceholders, autocompleteFilter]);

  // Get category for a placeholder name
  const getCategoryForPlaceholder = useCallback((name: string): PlaceholderCategory => {
    for (const group of placeholderGroups) {
      if (group.placeholders.some(p => p.name === name)) {
        return group.category;
      }
    }
    return 'contact';
  }, [placeholderGroups]);

  // Convert plain text to HTML with badge spans
  const textToHtml = useCallback((text: string): string => {
    const placeholderRegex = /\{([^}]+)\}/g;
    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = placeholderRegex.exec(text)) !== null) {
      // Add text before placeholder
      const textBefore = text.slice(lastIndex, match.index);
      result += escapeHtml(textBefore);

      // Add placeholder badge
      const name = match[1];
      const category = getCategoryForPlaceholder(name);
      const colors = getPlaceholderColorClasses(category, name);
      const isFieldEmpty = emptyFields?.has(name);
      
      result += `<span 
        contenteditable="false" 
        draggable="true" 
        data-placeholder="${name}"
        title="${isFieldEmpty ? 'Empty field' : ''}"
        class="inline-flex items-center px-2 py-0.5 mx-0.5 text-xs font-mono rounded-full border cursor-grab select-none relative ${colors.bg} ${colors.text} ${colors.border}"
      >{${name}}${isFieldEmpty ? '<span class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-none">✕</span>' : ''}</span>`;

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    result += escapeHtml(text.slice(lastIndex));

    return result;
  }, [getCategoryForPlaceholder, emptyFields]);

  // Convert HTML content back to plain text
  const htmlToText = useCallback((element: HTMLElement): string => {
    let result = '';
    
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        if (el.dataset.placeholder) {
          result += `{${el.dataset.placeholder}}`;
        } else if (el.tagName === 'BR') {
          result += '\n';
        } else if (el.tagName === 'DIV' && result.length > 0 && !result.endsWith('\n')) {
          result += '\n';
          el.childNodes.forEach(walk);
        } else {
          el.childNodes.forEach(walk);
        }
      }
    };

    element.childNodes.forEach(walk);
    return result;
  }, []);

  // Set cursor position in contenteditable
  const setCursorPosition = useCallback((position: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    const range = document.createRange();
    const sel = window.getSelection();
    let currentPos = 0;
    let found = false;

    const walk = (node: Node): boolean => {
      if (found) return true;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const len = node.textContent?.length || 0;
        if (currentPos + len >= position) {
          range.setStart(node, position - currentPos);
          range.collapse(true);
          found = true;
          return true;
        }
        currentPos += len;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.placeholder) {
          const placeholderLen = el.dataset.placeholder.length + 2;
          if (currentPos + placeholderLen >= position) {
            range.setStartAfter(el);
            range.collapse(true);
            found = true;
            return true;
          }
          currentPos += placeholderLen;
        } else {
          for (const child of Array.from(node.childNodes)) {
            if (walk(child)) return true;
          }
        }
      }
      return false;
    };

    for (const child of Array.from(editor.childNodes)) {
      if (walk(child)) break;
    }

    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  // Get current cursor position in terms of text length
  const getCursorPosition = useCallback((): number => {
    const editor = editorRef.current;
    if (!editor) return 0;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;

    const range = sel.getRangeAt(0);
    let position = 0;

    const walk = (node: Node): boolean => {
      if (node === range.startContainer) {
        if (node.nodeType === Node.TEXT_NODE) {
          position += range.startOffset;
        }
        return true;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        position += node.textContent?.length || 0;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.placeholder) {
          if (el.contains(range.startContainer) || el === range.startContainer) {
            position += el.dataset.placeholder.length + 2;
            return true;
          }
          position += el.dataset.placeholder.length + 2;
        } else {
          for (const child of Array.from(node.childNodes)) {
            if (walk(child)) return true;
          }
        }
      }
      return false;
    };

    for (const child of Array.from(editor.childNodes)) {
      if (walk(child)) break;
    }

    return position;
  }, []);

  // Handle input changes
  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    isUserInputRef.current = true;
    lastInputTimeRef.current = Date.now();
    const newText = htmlToText(editor);
    
    // Check if a placeholder was just completed (text ends with } and matches {placeholder})
    const justCompletedPlaceholder = newText.endsWith('}') && /\{[^{}]+\}$/.test(newText);
    if (justCompletedPlaceholder) {
      // Force HTML sync to transform to badge
      isUserInputRef.current = false;
    }
    
    lastValueRef.current = newText;
    onChange(newText);
  }, [htmlToText, onChange]);

  // Handle keydown for autocomplete
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredPlaceholders.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredPlaceholders[selectedIndex]) {
          insertPlaceholderFromAutocomplete(filteredPlaceholders[selectedIndex].name);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeAutocomplete();
      }
      return;
    }

    if (e.key === '{') {
      // Delay autocomplete opening to after the { is inserted
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current?.getBoundingClientRect();
          
          if (editorRect) {
            setAutocompletePosition({
              x: rect.left - editorRect.left,
              y: rect.bottom - editorRect.top + 4,
            });
          }
          
          autocompleteStartPos.current = getCursorPosition();
          setShowAutocomplete(true);
          setAutocompleteFilter('');
          setSelectedIndex(0);
        }
      });
    }
  }, [showAutocomplete, filteredPlaceholders, selectedIndex, getCursorPosition]);

  // Track autocomplete filter as user types
  useEffect(() => {
    if (!showAutocomplete || autocompleteStartPos.current === null) return;

    const checkFilter = () => {
      const currentPos = getCursorPosition();
      if (currentPos < autocompleteStartPos.current!) {
        closeAutocomplete();
        return;
      }

      // Extract text between { and cursor
      const startPos = autocompleteStartPos.current!;
      const filterText = value.slice(startPos, currentPos);
      
      // Close if user typed }
      if (filterText.includes('}')) {
        closeAutocomplete();
        return;
      }

      setAutocompleteFilter(filterText);
      setSelectedIndex(0);
    };

    const timer = setTimeout(checkFilter, 0);
    return () => clearTimeout(timer);
  }, [value, showAutocomplete, getCursorPosition]);

  const closeAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
    setAutocompleteFilter('');
    autocompleteStartPos.current = null;
  }, []);

  const insertPlaceholderFromAutocomplete = useCallback((name: string) => {
    if (autocompleteStartPos.current === null) return;

    const currentPos = getCursorPosition();
    // autocompleteStartPos is AFTER the { is inserted, so go back 1 to exclude the { we already typed
    const beforeBrace = value.slice(0, autocompleteStartPos.current - 1);
    const after = value.slice(currentPos);
    const newValue = beforeBrace + `{${name}}` + after;
    
    isUserInputRef.current = false; // Force HTML sync for insertions
    lastValueRef.current = newValue;
    onChange(newValue);
    closeAutocomplete();

    // Set cursor after inserted placeholder
    requestAnimationFrame(() => {
      setCursorPosition(beforeBrace.length + name.length + 2);
    });
  }, [value, onChange, getCursorPosition, setCursorPosition, closeAutocomplete]);

  // Handle drag over for visual insertion indicator - FIXED offset tracking
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const editor = editorRef.current;
    if (!editor) return;

    // Calculate insertion position based on mouse position
    const x = e.clientX;
    const y = e.clientY;

    // Find the character position closest to the mouse
    let bestPos = 0;
    let bestDist = Infinity;
    let currentOffset = 0;

    const walk = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const range = document.createRange();
        
        for (let i = 0; i <= text.length; i++) {
          range.setStart(node, i);
          range.collapse(true);
          const rect = range.getBoundingClientRect();
          const dist = Math.abs(rect.left - x) + Math.abs(rect.top + rect.height / 2 - y);
          
          if (dist < bestDist) {
            bestDist = dist;
            bestPos = currentOffset + i;
          }
        }
        currentOffset += text.length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.placeholder) {
          const rect = el.getBoundingClientRect();
          const placeholderLen = el.dataset.placeholder.length + 2;
          
          // Check distance to left edge (before placeholder)
          const distBefore = Math.abs(rect.left - x) + Math.abs(rect.top + rect.height / 2 - y);
          if (distBefore < bestDist) {
            bestDist = distBefore;
            bestPos = currentOffset;
          }
          
          // Check distance to right edge (after placeholder)
          const distAfter = Math.abs(rect.right - x) + Math.abs(rect.top + rect.height / 2 - y);
          if (distAfter < bestDist) {
            bestDist = distAfter;
            bestPos = currentOffset + placeholderLen;
          }
          
          currentOffset += placeholderLen;
        } else if (el.tagName === 'BR') {
          currentOffset += 1; // Account for line breaks
        } else {
          for (const child of Array.from(node.childNodes)) {
            walk(child);
          }
        }
      }
    };

    for (const child of Array.from(editor.childNodes)) {
      walk(child);
    }

    setDragInsertIndex(bestPos);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragInsertIndex(null);
  }, []);

  // Handle drop - FIXED with requestAnimationFrame
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const insertPos = dragInsertIndex;
    setDragInsertIndex(null);
    setIsDraggingInternal(false);

    const placeholder = e.dataTransfer.getData('text/plain');
    if (!placeholder) return;

    // Remove {} if present
    const name = placeholder.replace(/^\{|\}$/g, '');
    const insertText = `{${name}}`;

    if (insertPos !== null) {
      // If dragging from within editor, we need to handle removal
      const dragSourceData = e.dataTransfer.getData('application/x-drag-source');
      let newValue = value;
      let insertAt = insertPos;

      if (dragSourceData === 'internal') {
        // Find and remove the source placeholder
        const sourceMatch = value.match(new RegExp(`\\{${name}\\}`));
        if (sourceMatch && sourceMatch.index !== undefined) {
          const sourceStart = sourceMatch.index;
          const sourceEnd = sourceStart + sourceMatch[0].length;
          
          // Adjust insert position if source is before insert point
          if (sourceStart < insertAt) {
            insertAt -= sourceMatch[0].length;
          }
          
          newValue = value.slice(0, sourceStart) + value.slice(sourceEnd);
        }
      }

      const before = newValue.slice(0, insertAt);
      const after = newValue.slice(insertAt);
      const finalValue = before + insertText + after;
      
      isUserInputRef.current = false; // Force HTML sync
      lastValueRef.current = finalValue;
      onChange(finalValue);

      requestAnimationFrame(() => {
        setCursorPosition(before.length + insertText.length);
      });
    }
  }, [value, onChange, dragInsertIndex, setCursorPosition]);

  // Handle badge drag start
  const handleBadgeDragStart = useCallback((e: React.DragEvent, name: string) => {
    e.dataTransfer.setData('text/plain', `{${name}}`);
    e.dataTransfer.setData('application/x-drag-source', 'internal');
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingInternal(true);
  }, []);

  // Initialize editor content on mount only
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isInitializedRef.current) return;
    
    editor.innerHTML = textToHtml(value);
    lastValueRef.current = value;
    isInitializedRef.current = true;
  }, [textToHtml, value]);

  // Sync HTML with value - ONLY for external changes (autocomplete, drag-drop, prop changes)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !isInitializedRef.current) return;

    // Skip if this change came from user typing
    if (isUserInputRef.current) {
      isUserInputRef.current = false;
      lastValueRef.current = value;
      return;
    }

    // Only update HTML for external changes - compare with last known value
    if (lastValueRef.current !== value) {
      const pos = getCursorPosition();
      editor.innerHTML = textToHtml(value);
      lastValueRef.current = value;
      requestAnimationFrame(() => {
        setCursorPosition(Math.min(pos, value.length));
      });
    }
  }, [value, textToHtml, getCursorPosition, setCursorPosition]);

  // Update badge styling only when emptyFields actually changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !isInitializedRef.current) return;
    
    // Compare current emptyFields with previous to detect actual changes
    const currentEmptyFields = emptyFields || new Set<string>();
    const prevEmptyFields = lastEmptyFieldsRef.current;
    
    // Check if emptyFields actually changed
    const hasChanged = currentEmptyFields.size !== prevEmptyFields.size ||
      [...currentEmptyFields].some(field => !prevEmptyFields.has(field)) ||
      [...prevEmptyFields].some(field => !currentEmptyFields.has(field));
    
    if (!hasChanged) return;
    
    // Update the ref
    lastEmptyFieldsRef.current = new Set(currentEmptyFields);
    
    // Skip if user typed within last 500ms to prevent focus loss
    if (Date.now() - lastInputTimeRef.current < 500) return;
    
    const pos = getCursorPosition();
    editor.innerHTML = textToHtml(value);
    requestAnimationFrame(() => {
      setCursorPosition(Math.min(pos, value.length));
    });
  }, [emptyFields, textToHtml, getCursorPosition, setCursorPosition, value]);

  // Add event listeners to badges for drag
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const badges = editor.querySelectorAll('[data-placeholder]');
    badges.forEach(badge => {
      (badge as HTMLElement).ondragstart = (e) => {
        const name = (badge as HTMLElement).dataset.placeholder || '';
        handleBadgeDragStart(e as unknown as React.DragEvent, name);
      };
    });
  });

  // Render insertion cursor
  const renderInsertionCursor = useCallback(() => {
    if (dragInsertIndex === null) return null;
    
    const editor = editorRef.current;
    if (!editor) return null;

    // Find position for insertion cursor
    let currentPos = 0;
    let cursorX = 0;
    let cursorY = 0;
    let found = false;

    const walk = (node: Node): boolean => {
      if (found) return true;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const range = document.createRange();

        for (let i = 0; i <= text.length; i++) {
          if (currentPos + i === dragInsertIndex) {
            range.setStart(node, i);
            range.collapse(true);
            const rect = range.getBoundingClientRect();
            const editorRect = editor.getBoundingClientRect();
            cursorX = rect.left - editorRect.left;
            cursorY = rect.top - editorRect.top;
            found = true;
            return true;
          }
        }
        currentPos += text.length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.placeholder) {
          const len = el.dataset.placeholder.length + 2;
          if (currentPos === dragInsertIndex) {
            const rect = el.getBoundingClientRect();
            const editorRect = editor.getBoundingClientRect();
            cursorX = rect.left - editorRect.left;
            cursorY = rect.top - editorRect.top;
            found = true;
            return true;
          }
          if (currentPos + len === dragInsertIndex) {
            const rect = el.getBoundingClientRect();
            const editorRect = editor.getBoundingClientRect();
            cursorX = rect.right - editorRect.left;
            cursorY = rect.top - editorRect.top;
            found = true;
            return true;
          }
          currentPos += len;
        } else if (el.tagName === 'BR') {
          currentPos += 1;
        } else {
          for (const child of Array.from(node.childNodes)) {
            if (walk(child)) return true;
          }
        }
      }
      return false;
    };

    for (const child of Array.from(editor.childNodes)) {
      if (walk(child)) break;
    }

    if (!found) return null;

    return (
      <div
        className="absolute w-0.5 h-5 bg-primary animate-pulse pointer-events-none"
        style={{ left: cursorX, top: cursorY }}
      />
    );
  }, [dragInsertIndex]);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "min-h-[180px] p-3 border rounded-md font-mono text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring whitespace-pre-wrap",
          isDraggingInternal && "opacity-75",
          className
        )}
      />
      
      {renderInsertionCursor()}

      {/* Autocomplete dropdown */}
      {showAutocomplete && filteredPlaceholders.length > 0 && (
        <div
          className="absolute z-50 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto min-w-[200px]"
          style={{ left: autocompletePosition.x, top: autocompletePosition.y }}
        >
          {placeholderGroups.map(group => {
            const groupPlaceholders = filteredPlaceholders.filter(p => p.category === group.category);
            if (groupPlaceholders.length === 0) return null;

            return (
              <div key={group.label}>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {group.label}
                </div>
                {groupPlaceholders.map((p) => {
                  const globalIndex = filteredPlaceholders.indexOf(p);
                  const colors = getPlaceholderColorClasses(p.category, p.name);
                  
                  return (
                    <div
                      key={p.name}
                      className={cn(
                        "px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-accent",
                        globalIndex === selectedIndex && "bg-accent"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent focus loss from editor
                        insertPlaceholderFromAutocomplete(p.name);
                      }}
                    >
                      <span className={cn(
                        "px-1.5 py-0.5 text-xs font-mono rounded",
                        colors.bg, colors.text
                      )}>
                        {`{${p.name}}`}
                      </span>
                      {p.description && (
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
