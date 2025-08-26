
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
  
  return <Dashboard />;
}
