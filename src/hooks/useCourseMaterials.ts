import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { apiClient } from '../api/client';
import { Course } from '../api/types';

export const useCourseMaterials = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async (forceRefresh = false) => {
    let isMounted = true;
    try {
      setLoading(true);
      const cacheKey = `courses_cache_v2`;
      
      if (!forceRefresh) {
        const cachedData = await get(cacheKey);
        if (cachedData) {
          setCourses(cachedData);
          setLoading(false);
          setError(null);
          return;
        }
      }
      
      const url = forceRefresh ? `/courses/?t=${Date.now()}` : '/courses/';
      const response = await apiClient.get(url);
      if (isMounted) {
        await set(cacheKey, response.data);
        setCourses(response.data);
        setError(null);
      }
    } catch (err: any) {
      if (isMounted) {
        setError('Failed to load course materials.');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    return () => { isMounted = false };
  }, []);

  useEffect(() => {
    const cleanup = fetchCourses();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [fetchCourses]);

  return { courses, loading, error, refreshCourses: () => fetchCourses(true) };
};
