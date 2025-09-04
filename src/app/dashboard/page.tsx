
'use client';

import Dashboard from "@/components/Dashboard";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's a user, check their role.
    if (!loading && user) {
      const checkRoleAndRedirect = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // If the user is an admin, redirect them to the admin dashboard.
          if (userData.role === 'admin') {
            router.push('/admin/dashboard');
          }
        } else {
          // If user document doesn't exist for some reason, redirect to home.
          router.push('/');
        }
      };
      checkRoleAndRedirect();
    } else if (!loading && !user) {
      // If auth is done and there's no user, redirect to login.
      router.push('/');
    }
  }, [user, loading, router]);

  // While loading or if user is an admin (and redirect is pending), show a loading indicator.
  if (loading || !user) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  // Only regular users will see the main Dashboard component.
  // We can add an extra check here to prevent flashing the user dashboard for admins.
  // However, the useEffect handles the primary redirection logic.
  return <Dashboard />;
}
