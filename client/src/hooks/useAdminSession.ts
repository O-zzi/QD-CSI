import { useEffect, useCallback, useState, useRef } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminSessionState {
  sessionRemainingMs: number;
  inactivityTimeoutMs: number;
  reauthTimeoutMs: number;
  isActive: boolean;
}

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];
const ACTIVITY_DEBOUNCE = 5000; // 5 seconds debounce for activity

export function useAdminSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<AdminSessionState | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);

  const handleSessionExpired = useCallback((reason: string, code: string) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    toast({
      variant: "destructive",
      title: "Session Expired",
      description: reason || "Please log in again to continue.",
    });

    setTimeout(() => {
      setLocation("/login");
    }, 1500);
  }, [toast, setLocation]);

  const sendHeartbeat = useCallback(async () => {
    try {
      const response = await apiRequest("POST", "/api/admin/heartbeat");
      const data = await response.json();
      
      if (data.success) {
        setSessionState({
          sessionRemainingMs: data.sessionRemainingMs,
          inactivityTimeoutMs: data.inactivityTimeoutMs,
          reauthTimeoutMs: data.reauthTimeoutMs,
          isActive: true,
        });
        warningShownRef.current = false;
      }
    } catch (error: any) {
      if (error?.code === "ADMIN_REAUTH_REQUIRED" || error?.code === "ADMIN_INACTIVITY_TIMEOUT") {
        handleSessionExpired(error.reason || error.message, error.code);
      } else if (error?.status === 401 || error?.status === 403) {
        handleSessionExpired("Your session has expired. Please log in again.", "SESSION_EXPIRED");
      }
    }
  }, [handleSessionExpired]);

  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > ACTIVITY_DEBOUNCE) {
      lastActivityRef.current = now;
      sendHeartbeat();
    }
  }, [sendHeartbeat]);

  useEffect(() => {
    sendHeartbeat();

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [sendHeartbeat, handleUserActivity]);

  useEffect(() => {
    if (sessionState && sessionState.sessionRemainingMs < 60000 && !warningShownRef.current) {
      warningShownRef.current = true;
      const minutesRemaining = Math.ceil(sessionState.sessionRemainingMs / 60000);
      toast({
        variant: "default",
        title: "Session Expiring Soon",
        description: `Your admin session will expire in ${minutesRemaining} minute(s). You will need to log in again.`,
      });
    }
  }, [sessionState, toast]);

  return {
    sessionState,
    sendHeartbeat,
  };
}
