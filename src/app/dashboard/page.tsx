"use client";

import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getJSON } from "@/lib/api";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false); // State to control rendering

  useEffect(() => {
    // If auth is not loading and there's no user, redirect to login immediately.
    if (!loading && !user) {
      router.push("/");
      return;
    }

    // If there is a user, check their role.
    if (!loading && user) {
      const checkRoleAndRedirect = async () => {
        try {
          const resp = await getJSON(
            `/api/users/${encodeURIComponent(user.uid)}`
          );
          if (resp && resp.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            setIsAuthorized(true);
          }
        } catch (err) {
          console.error("Error fetching user role", err);
          router.push("/");
        }
      };
      checkRoleAndRedirect();
    }
  }, [user, loading, router]);

  // While loading or waiting for authorization, show a loading indicator.
  // This prevents the user dashboard from flashing for an admin before redirection.
  if (loading || !isAuthorized) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  // Only authorized, non-admin users will see the main Dashboard component.
  return <Dashboard />;
}
