import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('business/dashboard/');
        setStats(data || {});
      } catch (e) {
        setStats({});
      }
    })();
  }, []);

  return (
    <DashboardLayout />
  );
}
