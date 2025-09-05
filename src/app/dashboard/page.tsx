
'use client';

import Dashboard from "@/components/Dashboard";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false); // State to control rendering

  useEffect(() => {
    // If auth is not loading and there's no user, redirect to login immediately.
    if (!loading && !user) {
      router.push('/');
      return;
    }

    // If there is a user, check their role.
    if (!loading && user) {
      const checkRoleAndRedirect = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // If the user is an admin, redirect them to the admin dashboard.
            if (userData.role === 'admin') {
              router.push('/admin/dashboard');
            } else {
              // If the user is not an admin, authorize them to see the user dashboard.
              setIsAuthorized(true);
            }
          } else {
            // If user document doesn't exist for some reason, redirect to home.
            console.error("User document not found for logged-in user.");
            router.push('/');
          }
        } catch (error) {
            console.error("Error fetching user document:", error);
            router.push('/'); // Redirect on error
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
