'use client';

import { useEffect } from 'react';

export function StorageCleanup() {
  useEffect(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }, []);

  return null;
}
