import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Company data entry with field values and AI research
export type CompanyDataEntry = {
  fieldValues: Record<string, any>;
  aiSummary?: string;
  aiCustomResearch?: string;
};

// Company data is keyed by normalized company name
type CompanyDataStore = Record<string, CompanyDataEntry>;

const normalizeCompanyName = (name: string): string => {
  return name.toLowerCase().trim();
};

export function useCompanyData() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [companyData, setCompanyData] = useState<CompanyDataStore>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load company data from database
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_data')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error loading company data:', error);
        toast.error('Failed to load company data');
      } else if (data) {
        const dataStore: CompanyDataStore = {};
        data.forEach(row => {
          const key = normalizeCompanyName(row.company_name);
          dataStore[key] = {
            fieldValues: (row.field_values as Record<string, any>) || {},
            aiSummary: row.ai_summary || '',
            aiCustomResearch: row.ai_custom_research || '',
          };
        });
        setCompanyData(dataStore);
      }
      setIsLoading(false);
    };

    loadCompanyData();
  }, [organizationId]);

  const getCompanyData = useCallback((companyName: string): CompanyDataEntry => {
    const key = normalizeCompanyName(companyName);
    return companyData[key] || { fieldValues: {} };
  }, [companyData]);

  // Legacy getter for field values only (used by existing code)
  const getCompanyFieldValues = useCallback((companyName: string): Record<string, any> => {
    const key = normalizeCompanyName(companyName);
    return companyData[key]?.fieldValues || {};
  }, [companyData]);

  const updateCompanyData = useCallback(async (companyName: string, fieldId: string, value: any) => {
    if (!organizationId) {
      toast.error('Not authenticated');
      return;
    }
    
    const key = normalizeCompanyName(companyName);
    const existing = companyData[key] || { fieldValues: {} };
    const newFieldValues = {
      ...existing.fieldValues,
      [fieldId]: value,
    };
    
    setCompanyData(prev => ({
      ...prev,
      [key]: { ...existing, fieldValues: newFieldValues },
    }));

    // Check if record exists first
    const { data: existingRecord } = await supabase
      .from('company_data')
      .select('id')
      .eq('company_name', companyName)
      .single();

    if (existingRecord) {
      const { error } = await supabase
        .from('company_data')
        .update({ field_values: newFieldValues })
        .eq('company_name', companyName);

      if (error) {
        console.error('Error updating company data:', error);
        toast.error('Failed to save company data');
      }
    } else {
      const { error } = await supabase
        .from('company_data')
        .insert({
          company_name: companyName,
          field_values: newFieldValues,
          organization_id: organizationId,
        });

      if (error) {
        console.error('Error creating company data:', error);
        toast.error('Failed to save company data');
      }
    }
  }, [companyData, organizationId]);

  const setCompanyFieldValues = useCallback(async (companyName: string, values: Record<string, any>) => {
    if (!organizationId) {
      toast.error('Not authenticated');
      return;
    }
    
    const key = normalizeCompanyName(companyName);
    const existing = companyData[key] || { fieldValues: {} };
    
    setCompanyData(prev => ({
      ...prev,
      [key]: { ...existing, fieldValues: values },
    }));

    // Check if record exists first
    const { data: existingRecord } = await supabase
      .from('company_data')
      .select('id')
      .eq('company_name', companyName)
      .single();

    if (existingRecord) {
      const { error } = await supabase
        .from('company_data')
        .update({ field_values: values })
        .eq('company_name', companyName);

      if (error) {
        console.error('Error updating company data:', error);
        toast.error('Failed to save company data');
      }
    } else {
      const { error } = await supabase
        .from('company_data')
        .insert({
          company_name: companyName,
          field_values: values,
          organization_id: organizationId,
        });

      if (error) {
        console.error('Error creating company data:', error);
        toast.error('Failed to save company data');
      }
    }
  }, [companyData, organizationId]);

  const deleteCompanyField = useCallback(async (fieldId: string) => {
    // Remove this field from all companies
    const updated: CompanyDataStore = {};

    for (const [companyKey, entry] of Object.entries(companyData)) {
      const { [fieldId]: removed, ...restFields } = entry.fieldValues;
      if (Object.keys(restFields).length > 0 || entry.aiSummary || entry.aiCustomResearch) {
        updated[companyKey] = { ...entry, fieldValues: restFields };
        // Find original company name for database update
        await supabase
          .from('company_data')
          .update({ field_values: restFields })
          .ilike('company_name', companyKey);
      } else {
        // Delete the entire record if no fields left and no AI research
        await supabase
          .from('company_data')
          .delete()
          .ilike('company_name', companyKey);
      }
    }

    setCompanyData(updated);
  }, [companyData]);

  return {
    companyData,
    getCompanyData,
    getCompanyFieldValues,
    updateCompanyData,
    setCompanyFieldValues,
    deleteCompanyField,
    isLoading,
  };
}
