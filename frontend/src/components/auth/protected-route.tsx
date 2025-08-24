"use client";

import { useAuth } from "@/contexts/auth-context";
import { LoginForm } from "./login-form";
import { PasswordSetup } from "./password-setup";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "developer" | "viewer";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading, refreshUserData, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} loading={loading} />;
  }

  // Check if user needs to set up password
  if (user.needs_password_setup) {
    return <PasswordSetup onComplete={refreshUserData} />;
  }

  if (requiredRole) {
    const roleHierarchy = {
      viewer: 1,
      developer: 2,
      admin: 3,
    };

    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Access Denied
            </h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
