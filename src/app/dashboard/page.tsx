
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
    if (!loading && user) {
      const checkRoleAndRedirect = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            router.push('/admin/dashboard');
          }
        }
      };
      checkRoleAndRedirect();
    } else if (!loading && !user) {
        router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>; // Or a loading spinner
  }
  
  // Regular users will see this
  const userDocRef = user ? doc(db, 'users', user.uid) : null;
  if (userDocRef) {
      getDoc(userDocRef).then(doc => {
          if (doc.exists() && doc.data().role === 'admin') {
              // This is an admin, but the redirect hasn't happened yet.
              // Show loading to prevent flicker of the user dashboard.
              return <div>Loading...</div>;
          }
      })
  }

  return <Dashboard />;
}
