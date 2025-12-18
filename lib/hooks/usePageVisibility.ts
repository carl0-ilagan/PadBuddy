'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface PageVisibility {
  aboutPageVisible: boolean;
  helpPageVisible: boolean;
}

const defaultVisibility: PageVisibility = {
  aboutPageVisible: true,
  helpPageVisible: true,
};

export function usePageVisibility() {
  const [visibility, setVisibility] = useState<PageVisibility>(defaultVisibility);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'pageVisibility'),
      (doc) => {
        if (doc.exists()) {
          setVisibility(doc.data() as PageVisibility);
        } else {
          setVisibility(defaultVisibility);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching page visibility:', error);
        setVisibility(defaultVisibility);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { visibility, loading };
}

