import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronRight,
  Check,
  RotateCcw,
  History,
  Trash2,
  Eye
} from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { usePromptRefinements, PromptRefinement } from '@/hooks/usePromptRefinements';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { type PlaceholderCategory } from '@/components/PlaceholderBadge';

interface PlaceholderGroup {
  label: string;
  category: PlaceholderCategory;
  placeholders: { name: string; description?: string }[];
}

interface RefinePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptType: string;
  promptTitle: string;
  currentPrompt: string;
  placeholderGroups: PlaceholderGroup[];
  onApply: (refinedPrompt: string) => void;
}

export function RefinePromptDialog({
  open,
  onOpenChange,
  promptType,
  promptTitle,
  currentPrompt,
  placeholderGroups,
  onApply,
}: RefinePromptDialogProps) {
  const { contacts } = useContacts();
  const { 
    refinements, 
    isLoading: isLoadingHistory, 
    isRefining, 
    fetchRefinements, 
    refinePrompt, 
    saveRefinement,
    deleteRefinement 
  } = usePromptRefinements(promptType);

  // State
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [exampleOutput, setExampleOutput] = useState<string>('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [refinementSummary, setRefinementSummary] = useState<string[]>([]);
  const [diffHighlights, setDiffHighlights] = useState<{ before: string; after: string }[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingRefinement, setViewingRefinement] = useState<PromptRefinement | null>(null);

  // Available placeholders as strings
  const availablePlaceholders = useMemo(() => {
    return placeholderGroups.flatMap(g => g.placeholders.map(p => `{${p.name}}`));
  }, [placeholderGroups]);

  // Load history when dialog opens
  useEffect(() => {
    if (open) {
      fetchRefinements();
      // Reset state
      setExampleOutput('');
      setFeedback('');
      setRefinedPrompt('');
      setRefinementSummary([]);
      setDiffHighlights([]);
      setShowDiff(false);
      setViewingRefinement(null);
    }
  }, [open, fetchRefinements]);

  // Get selected contact
  const selectedContact = useMemo(() => {
    return contacts.find(c => c.id === selectedContactId);
  }, [contacts, selectedContactId]);

  // Generate preview using existing ai-research function
  const handleGeneratePreview = async () => {
    if (!selectedContact) {
      toast.error('Please select a contact first');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      // Determine which research type to use based on prompt type
      let researchType = 'company_search';
      if (promptType === 'company_custom' || promptType === 'custom_company_research') {
        researchType = 'company_custom';
      } else if (promptType === 'persona') {
        researchType = 'persona';
      }

      const { data, error } = await supabase.functions.invoke('ai-research', {
        body: {
          type: researchType,
          contact: selectedContact,
          promptOverride: currentPrompt
        }
      });

      if (error) throw error;

      if (data.result) {
        setExampleOutput(data.result);
        toast.success('Preview generated');
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Refine the prompt
  const handleRefine = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback on what to change');
      return;
    }

    const result = await refinePrompt(
      currentPrompt,
      exampleOutput || null,
      feedback,
      availablePlaceholders
    );

    if (result) {
      setRefinedPrompt(result.refinedPrompt);
      setRefinementSummary(result.refinementSummary);
      setDiffHighlights(result.diffHighlights);
      toast.success('Prompt refined! Review the changes below.');
    }
  };

  // Apply refined prompt
  const handleApply = async () => {
    if (!refinedPrompt) return;

    // Save to history
    await saveRefinement(
      currentPrompt,
      refinedPrompt,
      feedback,
      refinementSummary,
      selectedContactId || null,
      exampleOutput || null
    );

    onApply(refinedPrompt);
    onOpenChange(false);
    toast.success('Refined prompt applied');
  };

  // Use a historical refinement
  const handleUseRefinement = (refinement: PromptRefinement) => {
    setRefinedPrompt(refinement.refined_prompt);
    setRefinementSummary(refinement.refinement_summary);
    setFeedback(refinement.feedback);
    if (refinement.example_output) {
      setExampleOutput(refinement.example_output);
    }
    setShowHistory(false);
    setViewingRefinement(null);
  };

  // Provide more feedback (iterate)
  const handleMoreFeedback = () => {
    // Keep the refined prompt as the new starting point
    setFeedback('');
    setRefinementSummary([]);
    setDiffHighlights([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Refine Prompt: {promptTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Step 1: Select Contact */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Step 1: Select Sample Contact
              </Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contact for testing..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.slice(0, 50).map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName} - {contact.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Generate Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Step 2: Example Output
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePreview}
                  disabled={!selectedContactId || isGeneratingPreview}
                >
                  {isGeneratingPreview ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Preview'
                  )}
                </Button>
              </div>
              {exampleOutput ? (
                <ScrollArea className="h-48 border rounded-md p-3 bg-muted/30">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{exampleOutput}</ReactMarkdown>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-32 border rounded-md p-3 bg-muted/20 flex items-center justify-center text-muted-foreground text-sm">
                  {selectedContactId 
                    ? 'Click "Generate Preview" to see example output'
                    : 'Select a contact first, then generate a preview'
                  }
                </div>
              )}
            </div>

            {/* Step 3: Feedback */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Step 3: What would you like to change?
              </Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., Make it shorter, reorder sections, add more focus on pain points..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleRefine}
                  disabled={!feedback.trim() || isRefining}
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Refine Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Refined Prompt Result */}
            {refinedPrompt && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Refined Prompt</Label>
                  <Textarea
                    value={refinedPrompt}
                    onChange={(e) => setRefinedPrompt(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />

                  {/* Refinements Made */}
                  {refinementSummary.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Refinements Made</Label>
                        {diffHighlights.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDiff(!showDiff)}
                            className="h-7 text-xs"
                          >
                            {showDiff ? (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Hide Diff
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3 mr-1" />
                                Show Diff
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {refinementSummary.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Diff View */}
                      <Collapsible open={showDiff}>
                        <CollapsibleContent>
                          <div className="mt-3 space-y-2 border rounded-md p-3 bg-muted/20">
                            {diffHighlights.map((diff, i) => (
                              <div key={i} className="space-y-1 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="text-red-500 font-mono">-</span>
                                  <span className="text-red-600 dark:text-red-400 line-through">
                                    {diff.before}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-green-500 font-mono">+</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {diff.after}
                                  </span>
                                </div>
                                {i < diffHighlights.length - 1 && (
                                  <Separator className="my-2" />
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMoreFeedback}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Provide More Feedback
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleApply}>
                        <Check className="h-4 w-4 mr-1" />
                        Apply to Editor
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* History Sidebar */}
          <div className="w-64 border-l bg-muted/10 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 text-sm font-medium">
                <History className="h-4 w-4" />
                Past Refinements
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : refinements.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No refinement history yet
                  </div>
                ) : (
                  refinements.map(refinement => (
                    <div
                      key={refinement.id}
                      className="p-2 border rounded-md bg-background hover:bg-accent/50 transition-colors"
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(new Date(refinement.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm truncate mb-2">
                        "{refinement.feedback.slice(0, 50)}..."
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={() => setViewingRefinement(
                            viewingRefinement?.id === refinement.id ? null : refinement
                          )}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={() => handleUseRefinement(refinement)}
                        >
                          Use
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => deleteRefinement(refinement.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Expanded view */}
                      {viewingRefinement?.id === refinement.id && (
                        <div className="mt-2 pt-2 border-t space-y-2">
                          <div className="text-xs">
                            <span className="font-medium">Feedback:</span>
                            <p className="text-muted-foreground mt-1">
                              {refinement.feedback}
                            </p>
                          </div>
                          {refinement.refinement_summary.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium">Changes:</span>
                              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                                {refinement.refinement_summary.map((s, i) => (
                                  <li key={i}>• {s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
