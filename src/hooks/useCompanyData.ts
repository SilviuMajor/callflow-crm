import { useState, useCallback } from 'react';

const STORAGE_KEY = 'company_data';

// Company data is keyed by normalized company name
type CompanyDataStore = Record<string, Record<string, any>>;

const normalizeCompanyName = (name: string): string => {
  return name.toLowerCase().trim();
};

const loadFromStorage = (): CompanyDataStore => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveToStorage = (data: CompanyDataStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export function useCompanyData() {
  const [companyData, setCompanyData] = useState<CompanyDataStore>(loadFromStorage);

  const persistData = useCallback((newData: CompanyDataStore) => {
    setCompanyData(newData);
    saveToStorage(newData);
  }, []);

  const getCompanyData = useCallback((companyName: string): Record<string, any> => {
    const key = normalizeCompanyName(companyName);
    return companyData[key] || {};
  }, [companyData]);

  const updateCompanyData = useCallback((companyName: string, fieldId: string, value: any) => {
    const key = normalizeCompanyName(companyName);
    const existing = companyData[key] || {};
    const updated = {
      ...companyData,
      [key]: {
        ...existing,
        [fieldId]: value,
      },
    };
    persistData(updated);
  }, [companyData, persistData]);

  const setCompanyFieldValues = useCallback((companyName: string, values: Record<string, any>) => {
    const key = normalizeCompanyName(companyName);
    const updated = {
      ...companyData,
      [key]: values,
    };
    persistData(updated);
  }, [companyData, persistData]);

  const deleteCompanyField = useCallback((fieldId: string) => {
    // Remove this field from all companies
    const updated: CompanyDataStore = {};
    for (const [companyKey, data] of Object.entries(companyData)) {
      const { [fieldId]: removed, ...rest } = data;
      if (Object.keys(rest).length > 0) {
        updated[companyKey] = rest;
      }
    }
    persistData(updated);
  }, [companyData, persistData]);

  return {
    companyData,
    getCompanyData,
    updateCompanyData,
    setCompanyFieldValues,
    deleteCompanyField,
  };
}
