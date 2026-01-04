import { QualifyingQuestion } from '@/types/contact';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star } from 'lucide-react';

interface QualifyingFieldsProps {
  questions: QualifyingQuestion[];
  answers: Record<string, any>;
  onChange: (questionId: string, value: any) => void;
}

export function QualifyingFields({ questions, answers, onChange }: QualifyingFieldsProps) {
  const renderField = (question: QualifyingQuestion) => {
    const value = answers[question.id] ?? '';
    
    switch (question.type) {
      case 'short_text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={question.type === 'email' ? 'email' : question.type === 'phone' ? 'tel' : question.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder={`Enter ${question.label.toLowerCase()}`}
            className="h-8 text-sm"
          />
        );
        
      case 'long_text':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder={`Enter ${question.label.toLowerCase()}`}
            className="text-sm min-h-[60px]"
          />
        );
        
      case 'number':
      case 'currency':
        return (
          <div className="relative">
            {question.type === 'currency' && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            )}
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(question.id, e.target.value)}
              placeholder="0"
              className={`h-8 text-sm ${question.type === 'currency' ? 'pl-6' : ''}`}
            />
          </div>
        );
        
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="h-8 text-sm"
          />
        );
        
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(question.id, star)}
                className="p-0.5 hover:scale-110 transition-transform"
              >
                <Star 
                  className={`w-5 h-5 ${star <= (value || 0) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                />
              </button>
            ))}
          </div>
        );
        
      case 'dropdown':
        return (
          <Select value={value} onValueChange={(v) => onChange(question.id, v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map(option => (
                <SelectItem key={option} value={option} className="text-sm">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'radio':
        return (
          <RadioGroup value={value} onValueChange={(v) => onChange(question.id, v)} className="space-y-1">
            {question.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1">
            {question.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox 
                  id={`${question.id}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked 
                      ? [...selectedValues, option]
                      : selectedValues.filter((v: string) => v !== option);
                    onChange(question.id, newValues);
                  }}
                />
                <Label htmlFor={`${question.id}-${option}`} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (questions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        No qualifying questions set
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {questions.sort((a, b) => a.order - b.order).map(question => (
        <div key={question.id} className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {question.label}
            {question.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {renderField(question)}
        </div>
      ))}
    </div>
  );
}
