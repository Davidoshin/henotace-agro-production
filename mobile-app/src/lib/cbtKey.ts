export const getUserApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('developerApiKey') || '';
};

export const getInstitutionApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('institutionApiKey') || '';
};

export const getUseInstitutionFlag = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('useInstitutionKey') === '1';
};

export const setUseInstitutionFlag = (on: boolean) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('useInstitutionKey', on ? '1' : '0');
};

export const setUserApiKey = (k: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('developerApiKey', k);
};

export const setInstitutionApiKey = (k: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('institutionApiKey', k);
};

export const getEffectiveApiKey = (): string => {
  const useInst = getUseInstitutionFlag();
  const inst = getInstitutionApiKey();
  const user = getUserApiKey();
  if (useInst && inst) return inst;
  return user || inst || '';
};


