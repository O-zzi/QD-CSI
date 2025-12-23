import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Contact() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/");
    setTimeout(() => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }, [setLocation]);

  return null;
}
