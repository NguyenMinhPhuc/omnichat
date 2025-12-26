"use client";

import LeadsManagement from "@/components/LeadsManagement";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (!loading && user) {
      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  if (loading || !isAuthorized) {
    return <div>Loading...</div>;
  }

  return <LeadsManagement />;
}
