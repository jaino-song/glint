'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@glint/validators';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useRegister } from '@/hooks';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const registerMutation = useRegister();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      await registerMutation.mutateAsync(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mb-4 inline-block text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"
          >
            Glint
          </Link>
          <CardTitle>Create your account</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Start analyzing videos with AI
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Input
              {...register('name')}
              type="text"
              label="Name (optional)"
              placeholder="Your name"
              error={errors.name?.message}
              leftIcon={<User className="h-4 w-4" />}
              autoComplete="name"
            />

            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="you@example.com"
              error={errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />

            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
              helperText="Must contain uppercase, lowercase, and number"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting || registerMutation.isPending}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
