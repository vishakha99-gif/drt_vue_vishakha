type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const useApiFetch = async <T = any>(
  url: string,
  method: HttpMethod = 'GET',
  options: {
    body?: any;
    params?: any;
    headers?: HeadersInit;
  } = {}
): Promise<T> => {
  const config = useRuntimeConfig();
  try {
    return await $fetch<T>(config.public.baseUrl + url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    throw error;
  }
};
