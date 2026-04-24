"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export default function Profile() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">{error.message}</div>;
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
      {user.picture && (
        <img 
          src={user.picture} 
          alt={user.name || 'User'} 
          className="w-12 h-12 rounded-full object-cover"
        />
      )}
      <div>
        <h3 className="text-white font-medium">{user.name}</h3>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>
    </div>
  );
}