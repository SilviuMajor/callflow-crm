import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Company data is keyed by normalized company name
type CompanyDataStore = Record<string, Record<string, any>>;

const normalizeCompanyName = (name: string): string => {
  return name.toLowerCase().trim();
};

export function useCompanyData() {
  const [companyData, setCompanyData] = useState<CompanyDataStore>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load company data from database
  useEffect(() => {
    const loadCompanyData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_data')
        .select('*');

      if (error) {
        console.error('Error loading company data:', error);
        toast.error('Failed to load company data');
      } else if (data) {
        const dataStore: CompanyDataStore = {};
        data.forEach(row => {
          const key = normalizeCompanyName(row.company_name);
          dataStore[key] = (row.field_values as Record<string, any>) || {};
        });
        setCompanyData(dataStore);
      }
      setIsLoading(false);
    };

    loadCompanyData();
  }, []);

  const getCompanyData = useCallback((companyName: string): Record<string, any> => {
    const key = normalizeCompanyName(companyName);
    return companyData[key] || {};
  }, [companyData]);

  const updateCompanyData = useCallback(async (companyName: string, fieldId: string, value: any) => {
    const key = normalizeCompanyName(companyName);
    const existing = companyData[key] || {};
    const newValues = {
      ...existing,
      [fieldId]: value,
    };
    
    setCompanyData(prev => ({
      ...prev,
      [key]: newValues,
    }));

    // Upsert to database
    const { error } = await supabase
      .from('company_data')
      .upsert({
        company_name: companyName,
        field_values: newValues,
      }, {
        onConflict: 'company_name',
      });

    if (error) {
      console.error('Error updating company data:', error);
      toast.error('Failed to save company data');
    }
  }, [companyData]);

  const setCompanyFieldValues = useCallback(async (companyName: string, values: Record<string, any>) => {
    const key = normalizeCompanyName(companyName);
    
    setCompanyData(prev => ({
      ...prev,
      [key]: values,
    }));

    // Upsert to database
    const { error } = await supabase
      .from('company_data')
      .upsert({
        company_name: companyName,
        field_values: values,
      }, {
        onConflict: 'company_name',
      });

    if (error) {
      console.error('Error setting company field values:', error);
      toast.error('Failed to save company data');
    }
  }, []);

  const deleteCompanyField = useCallback(async (fieldId: string) => {
    // Remove this field from all companies
    const updated: CompanyDataStore = {};

    for (const [companyKey, data] of Object.entries(companyData)) {
      const { [fieldId]: removed, ...rest } = data;
      if (Object.keys(rest).length > 0) {
        updated[companyKey] = rest;
        // Find original company name for database update
        await supabase
          .from('company_data')
          .update({ field_values: rest })
          .ilike('company_name', companyKey);
      } else {
        // Delete the entire record if no fields left
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
    updateCompanyData,
    setCompanyFieldValues,
    deleteCompanyField,
    isLoading,
  };
}
