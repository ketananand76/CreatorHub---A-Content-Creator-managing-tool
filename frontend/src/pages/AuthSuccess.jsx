import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAccessToken } = useAuth(); // If AuthContext exposes this, otherwise we might need to rely on localStorage and a reload

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      // Let's redirect to dashboard which will trigger AuthContext to re-hydrate
      window.location.href = '/dashboard';
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
        <h2 className="text-xl font-outfit font-bold">Completing authentication...</h2>
      </div>
    </div>
  );
}
