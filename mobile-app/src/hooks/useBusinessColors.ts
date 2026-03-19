import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";

interface BusinessColors {
  primary_color?: string;
  secondary_color?: string;
  navbar_color?: string;
  footer_color?: string;
  text_color?: string;
}

export function useBusinessColors() {
  const [colors, setColors] = useState<BusinessColors>({
    primary_color: "#3b82f6",
    secondary_color: "#1f2937",
    navbar_color: "#111827",
    footer_color: "#111827",
    text_color: "#ffffff"
  });

  useEffect(() => {
    const loadBusinessColors = async () => {
      try {
        const response = await apiGet('business/');
        if (response.success && response.business) {
          setColors({
            primary_color: response.business.primary_color || "#3b82f6",
            secondary_color: response.business.secondary_color || "#1f2937",
            navbar_color: response.business.navbar_color || "#111827",
            footer_color: response.business.footer_color || "#111827",
            text_color: response.business.text_color || "#ffffff"
          });
        }
      } catch (error) {
        console.error("Error loading business colors:", error);
      }
    };

    loadBusinessColors();
  }, []);

  return colors;
}
