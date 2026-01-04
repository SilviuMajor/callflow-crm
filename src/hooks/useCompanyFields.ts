import { useState, useCallback } from 'react';
import { CompanyField } from '@/types/contact';

const generateId = () => Math.random().toString(36).substr(2, 9);

const STORAGE_KEY = 'company_fields';

const loadFromStorage = (): CompanyField[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (fields: CompanyField[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
};

export function useCompanyFields() {
  const [fields, setFields] = useState<CompanyField[]>(loadFromStorage);

  const persistFields = useCallback((newFields: CompanyField[]) => {
    setFields(newFields);
    saveToStorage(newFields);
  }, []);

  const addField = useCallback((field: Omit<CompanyField, 'id' | 'order'>) => {
    const newField: CompanyField = {
      ...field,
      id: generateId(),
      order: fields.length,
    };
    persistFields([...fields, newField]);
    return newField.id;
  }, [fields, persistFields]);

  const updateField = useCallback((id: string, updates: Partial<Omit<CompanyField, 'id'>>) => {
    persistFields(fields.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  }, [fields, persistFields]);

  const archiveField = useCallback((id: string) => {
    persistFields(fields.map(f => 
      f.id === id ? { ...f, isArchived: true } : f
    ));
  }, [fields, persistFields]);

  const restoreField = useCallback((id: string) => {
    const activeCount = fields.filter(f => !f.isArchived).length;
    persistFields(fields.map(f => 
      f.id === id ? { ...f, isArchived: false, order: activeCount } : f
    ));
  }, [fields, persistFields]);

  const deleteField = useCallback((id: string) => {
    const filtered = fields.filter(f => f.id !== id);
    const reordered = filtered.map((f, index) => ({ ...f, order: index }));
    persistFields(reordered);
  }, [fields, persistFields]);

  const reorderFields = useCallback((newOrder: string[]) => {
    const fieldMap = new Map(fields.map(f => [f.id, f]));
    const reordered = newOrder.map((id, index) => ({
      ...fieldMap.get(id)!,
      order: index,
    }));
    const archived = fields.filter(f => f.isArchived);
    persistFields([...reordered, ...archived]);
  }, [fields, persistFields]);

  return {
    fields,
    addField,
    updateField,
    archiveField,
    restoreField,
    deleteField,
    reorderFields,
    setFields: persistFields,
  };
}
