import { useQuery } from '@tanstack/react-query';

interface AdminConfig {
  adminPath: string;
}

export function useAdminPath() {
  const { data, isLoading, error } = useQuery<AdminConfig>({
    queryKey: ['/api/admin/config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/config', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Not authorized to access admin config');
      }
      return res.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 30,
  });

  return {
    adminPath: data?.adminPath || 'admin',
    isLoading,
    error,
    isAuthorized: !!data && !error,
  };
}

export function getAdminBasePath(): string {
  return (window as any).__ADMIN_PATH__ || 'admin';
}
