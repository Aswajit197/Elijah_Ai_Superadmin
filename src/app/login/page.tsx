'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { setAdminAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('superadmin@elijah.ai');
  const [password, setPassword] = useState('SuperSecretPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<{
        token: string;
        superAdmin: { id: string; email: string; name: string };
      }>('/super/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAdminAuth(result.token, result.superAdmin);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white shadow-xl shadow-primary-glow mb-4">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Elijah AI SuperAdmin</h1>
          <p className="text-sm text-muted mt-1.5">
            Platform control center for multi-tenant management
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-2.5 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="SuperAdmin Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@elijah.ai"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              Sign In to Platform Control <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Security footnote */}
          <div className="mt-6 pt-5 border-t border-border/70 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-subtle">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Protected by Elijah AI Platform Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

