import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Updates() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/roadmap");
  }, [setLocation]);

  return null;
}
