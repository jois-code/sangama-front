import { apiClient } from './client';
import { getPesuPassword } from './credentialVault';

type PesuPayload = Record<string, number>;
type PesuProxyResponse = Record<string, unknown> | unknown[];

interface SemesterOption {
  id: string;
  section_id: string;
}

interface IsaComponent {
  name?: string;
  marks?: number;
}

interface IsaMark {
  actual_grade?: string | null;
  components?: IsaComponent[];
}

interface IsaResponse {
  success: boolean;
  marks: IsaMark[];
  actual_sgpa?: string | null;
  semesters: SemesterOption[];
  selected_batch_id?: string;
}

/**
 * Helper function to retrieve the raw PESU password for this browser session.
 * The password is intentionally kept in memory only, never browser storage.
 */
const getRawCredentials = () => {
  const password = getPesuPassword();
  if (!password) {
    throw new Error('CREDENTIALS_MISSING');
  }

  return { password };
};

const inflightRequests: Record<string, Promise<unknown>> = {};

/**
 * Generic wrapper for PESU API requests.
 */
const fetchFromProxy = async <TResponse = unknown>(
  endpoint: string,
  payload: PesuPayload = {},
  forceRefresh = false,
): Promise<TResponse> => {
  const cacheKey = `pesu_cache_${endpoint}_${JSON.stringify(payload)}`;
  
  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as TResponse;
    }
  }

  if (inflightRequests[cacheKey] !== undefined) {
    return inflightRequests[cacheKey] as Promise<TResponse>;
  }

  const creds = getRawCredentials();
  
  const promise = apiClient.post(`/pesu/${endpoint}`, { 
    password: creds.password,
    ...payload
  }).then(response => {
    localStorage.setItem(cacheKey, JSON.stringify(response.data));
    delete inflightRequests[cacheKey];
    return response.data as TResponse;
  }).catch(err => {
    delete inflightRequests[cacheKey];
    throw err;
  });
  
  inflightRequests[cacheKey] = promise;
  return promise;
};

export const pesuApi = {
  getAttendance: (forceRefresh?: boolean) => fetchFromProxy<PesuProxyResponse>('attendance', {}, forceRefresh),
  getTimetable: (forceRefresh?: boolean) => fetchFromProxy<PesuProxyResponse>('timetable', {}, forceRefresh),
  getIsa: async (batchClassId?: string | number, classBatchSectionId?: string | number, forceRefresh?: boolean) => {
    const payload: PesuPayload = {};
    const bId = Number.parseInt(String(batchClassId ?? ''), 10);
    const sId = Number.parseInt(String(classBatchSectionId ?? ''), 10);
    if (!isNaN(bId)) payload.batchClassId = bId;
    if (!isNaN(sId)) payload.classBatchSectionId = sId;
    
    const response = await fetchFromProxy<IsaResponse>('isa', payload, forceRefresh);
    
    // Double-cache the initial response under its explicit ID
    if (Object.keys(payload).length === 0 && response && response.selected_batch_id) {
      const explicitPayload: PesuPayload = {};
      const explicitBId = Number.parseInt(String(response.selected_batch_id), 10);
      if (!isNaN(explicitBId)) explicitPayload.batchClassId = explicitBId;
      
      const match = response.semesters?.find((s) => Number.parseInt(String(s.id), 10) === explicitBId);
      if (match) {
        const explicitSId = Number.parseInt(String(match.section_id), 10);
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

export const getAcademicStatus = (isaResponse: IsaResponse | null | undefined, userSemesterStr?: string): string | null => {
  if (!isaResponse || !isaResponse.success || !isaResponse.marks) return null;
  let isEsaOut = !!isaResponse.actual_sgpa && isaResponse.actual_sgpa !== 'N/A';
  let isIsa2Out = false;
  
  if (!isEsaOut) {
    if (isaResponse.marks.some((m) => m.actual_grade)) {
      isEsaOut = true;
    }
  }
  
  isaResponse.marks.forEach((sub) => {
    const isa2 = sub.components?.find((c) => {
      const name = c.name ?? '';
      return name.includes("ISA 2") || name.includes("ISA-2") || name.includes("ISA2");
    });
    if (isa2 && Number(isa2.marks ?? 0) > 0) {
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
