"use client";

import { AuthLoading, Unauthenticated, useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignIn } from "./sign-in";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const access = useQuery(api.staff.access, isAuthenticated ? {} : "skip");

  return (
    <>
      <AuthLoading>
        <main className="auth-page"><p className="auth-copy">Checking staff access…</p></main>
      </AuthLoading>
      <Unauthenticated><SignIn /></Unauthenticated>
      {isAuthenticated && access?.staff && children}
      {isAuthenticated && access && !access.staff && (
        <main className="auth-page">
          <section className="auth-card">
            <p className="auth-kicker">CMIFF 2026 · OPERATIONS</p>
            <h1>Staff access only</h1>
            <p className="auth-copy">
              This account is not on the tracker’s staff allowlist. Ask the
              administrator to add its email address.
            </p>
          </section>
        </main>
      )}
    </>
  );
}