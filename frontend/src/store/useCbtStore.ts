import { create } from 'zustand';

interface CbtState {
  userApiKey: string;
  institutionApiKey: string;
  useInstitutionKey: boolean;
  setUserApiKey: (k: string) => void;
  setInstitutionApiKey: (k: string) => void;
  setUseInstitutionKey: (b: boolean) => void;
  getEffectiveKey: () => string;
}

export const useCbtStore = create<CbtState>((set, get) => ({
  userApiKey: typeof window !== 'undefined' ? (localStorage.getItem('developerApiKey') || '') : '',
  institutionApiKey: typeof window !== 'undefined' ? (localStorage.getItem('institutionApiKey') || '') : '',
  useInstitutionKey: typeof window !== 'undefined' ? (localStorage.getItem('useInstitutionKey') === '1') : false,
  setUserApiKey: (k) => { localStorage.setItem('developerApiKey', k); set({ userApiKey: k }); },
  setInstitutionApiKey: (k) => { localStorage.setItem('institutionApiKey', k); set({ institutionApiKey: k }); },
  setUseInstitutionKey: (b) => { localStorage.setItem('useInstitutionKey', b ? '1' : '0'); set({ useInstitutionKey: b }); },
  getEffectiveKey: () => {
    const s = get();
    if (s.useInstitutionKey && s.institutionApiKey) return s.institutionApiKey;
    return s.userApiKey || s.institutionApiKey || '';
  }
}));


