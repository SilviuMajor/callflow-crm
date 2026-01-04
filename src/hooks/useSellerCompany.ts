import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SellerCompany {
  id: string;
  company_name: string;
  website: string;
  product_offering: string;
  usps: string;
  industry: string;
  target_audience: string;
  tone_style: string;
  pain_points_solved: string;
  product_sets: string;
  created_at: string;
  updated_at: string;
}

export function useSellerCompany() {
  const [sellerCompany, setSellerCompany] = useState<SellerCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSellerCompany = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_company')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setSellerCompany(data || null);
    } catch (error) {
      console.error('Error fetching seller company:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellerCompany();
  }, [fetchSellerCompany]);

  const updateField = useCallback(async (field: keyof SellerCompany, value: string) => {
    try {
      if (sellerCompany) {
        // Update existing record
        const { error } = await supabase
          .from('seller_company')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('id', sellerCompany.id);

        if (error) throw error;
        
        setSellerCompany(prev => prev ? { ...prev, [field]: value } : null);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('seller_company')
          .insert({ [field]: value })
          .select()
          .single();

        if (error) throw error;
        setSellerCompany(data);
      }
    } catch (error) {
      console.error('Error updating seller company:', error);
      toast.error('Failed to save');
      throw error;
    }
  }, [sellerCompany]);

  const getContextString = useCallback(() => {
    if (!sellerCompany) return '';
    
    const parts = [];
    if (sellerCompany.company_name) parts.push(`Our company: ${sellerCompany.company_name}`);
    if (sellerCompany.website) parts.push(`Website: ${sellerCompany.website}`);
    if (sellerCompany.product_offering) parts.push(`Product/Service: ${sellerCompany.product_offering}`);
    if (sellerCompany.usps) parts.push(`USPs: ${sellerCompany.usps}`);
    if (sellerCompany.industry) parts.push(`Industry: ${sellerCompany.industry}`);
    if (sellerCompany.target_audience) parts.push(`Target audience: ${sellerCompany.target_audience}`);
    if (sellerCompany.pain_points_solved) parts.push(`Pain points we solve: ${sellerCompany.pain_points_solved}`);
    if (sellerCompany.product_sets) parts.push(`Product sets: ${sellerCompany.product_sets}`);
    if (sellerCompany.tone_style) parts.push(`Communication style: ${sellerCompany.tone_style}`);
    
    return parts.join('\n');
  }, [sellerCompany]);

  return {
    sellerCompany,
    isLoading,
    updateField,
    getContextString,
    refetch: fetchSellerCompany,
  };
}
