import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 30000,
  });

  const isAuthenticated = !isLoading && !!user;

  useSession(isAuthenticated);

  return <>{children}</>;
}
