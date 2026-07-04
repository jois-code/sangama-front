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
  getIsa: (batchClassId?: number, classBatchSectionId?: number, forceRefresh?: boolean) => 
    fetchFromProxy('isa', { batchClassId, classBatchSectionId }, forceRefresh),
  getEsa: (forceRefresh?: boolean) => fetchFromProxy('esa', {}, forceRefresh),
  getProfile: (forceRefresh?: boolean) => fetchFromProxy('profile', {}, forceRefresh),
};
