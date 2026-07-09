import { apiClient } from './client';

/**
 * Helper function to retrieve the raw PESU password on-the-fly.
 */
const getRawCredentials = () => {
  const password = localStorage.getItem('pesu_pwd');
  if (!password) {
    throw new Error('CREDENTIALS_MISSING');
  }

  return { password };
};

const inflightRequests: Record<string, Promise<any>> = {};

/**
 * Generic wrapper for PESU API requests.
 */
const fetchFromProxy = async (endpoint: string, payload: any = {}, forceRefresh = false) => {
  const cacheKey = `pesu_cache_${endpoint}_${JSON.stringify(payload)}`;
  
  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  if (inflightRequests[cacheKey] !== undefined) {
    return inflightRequests[cacheKey];
  }

  const creds = getRawCredentials();
  
  const promise = apiClient.post(`/pesu/${endpoint}`, { 
    username: "inferred-by-backend", // we updated backend pesu.py to use current_user.srn
    password: creds.password,
    ...payload
  }).then(response => {
    localStorage.setItem(cacheKey, JSON.stringify(response.data));
    delete inflightRequests[cacheKey];
    return response.data;
  }).catch(err => {
    delete inflightRequests[cacheKey];
    throw err;
  });
  
  inflightRequests[cacheKey] = promise;
  return promise;
};

export const pesuApi = {
  getAttendance: (forceRefresh?: boolean) => fetchFromProxy('attendance', {}, forceRefresh),
  getTimetable: (forceRefresh?: boolean) => fetchFromProxy('timetable', {}, forceRefresh),
  getIsa: async (batchClassId?: any, classBatchSectionId?: any, forceRefresh?: boolean) => {
    const payload: any = {};
    const bId = parseInt(batchClassId);
    const sId = parseInt(classBatchSectionId);
    if (!isNaN(bId)) payload.batchClassId = bId;
    if (!isNaN(sId)) payload.classBatchSectionId = sId;
    
    const response = await fetchFromProxy('isa', payload, forceRefresh);
    
    // Double-cache the initial response under its explicit ID
    if (Object.keys(payload).length === 0 && response && response.selected_batch_id) {
      const explicitPayload: any = {};
      const explicitBId = parseInt(response.selected_batch_id);
      if (!isNaN(explicitBId)) explicitPayload.batchClassId = explicitBId;
      
      const match = response.semesters?.find((s: any) => parseInt(s.id) === explicitBId);
      if (match) {
        const explicitSId = parseInt(match.section_id);
        if (!isNaN(explicitSId)) explicitPayload.classBatchSectionId = explicitSId;
      }
      
      const explicitCacheKey = `pesu_cache_isa_${JSON.stringify(explicitPayload)}`;
      localStorage.setItem(explicitCacheKey, JSON.stringify(response));
    }
    
    return response;
  },
  getEsa: (forceRefresh?: boolean) => fetchFromProxy('esa', {}, forceRefresh),
  getProfile: (forceRefresh?: boolean) => fetchFromProxy('profile', {}, forceRefresh),
};

export const getAcademicStatus = (isaResponse: any, userSemesterStr?: string): string | null => {
  if (!isaResponse || !isaResponse.success || !isaResponse.marks) return null;
  let isEsaOut = !!isaResponse.actual_sgpa && isaResponse.actual_sgpa !== 'N/A';
  let isIsa2Out = false;
  
  if (!isEsaOut) {
    if (isaResponse.marks.some((m: any) => m.actual_grade)) {
      isEsaOut = true;
    }
  }
  
  isaResponse.marks.forEach((sub: any) => {
    const isa2 = sub.components?.find((c: any) => c.name.includes("ISA 2") || c.name.includes("ISA-2") || c.name.includes("ISA2"));
    if (isa2 && isa2.marks > 0) {
      isIsa2Out = true;
    }
  });

  const semStr = String(userSemesterStr || '0');
  const sem = parseInt(semStr.replace(/\D/g, '') || '0');
  
  if (sem === 7 || sem === 8 || (sem === 6 && isEsaOut)) {
    return "MAGA WHAT ARE YOU DOING HERE??? DON'T YOU HAVE PLACEMENT TO PREPARE???";
  } else if (isEsaOut) {
    return "chill maga exan is over ;)";
  } else if (isIsa2Out) {
    return "maga grind for esa";
  }
  
  return null;
};
