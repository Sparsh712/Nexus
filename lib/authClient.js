"use client";

import { useState, useEffect } from 'react';

export function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user data...');
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          console.log('User data received:', userData.email || userData.sub);
          setUser(userData);
        } else {
          console.log('User fetch failed:', response.status, response.statusText);
          setUser(null);
        }
      } catch (err) {
        console.error('User fetch error:', err);
        setError(err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return {
    user: user || null,
    isSignedIn: !!user && !isLoading,
    isLoading,
    error,
  };
}

export const loginHref = "/api/auth/login";
export const logoutHref = "/api/auth/logout";

export default useUser;
