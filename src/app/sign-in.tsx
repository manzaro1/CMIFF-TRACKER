"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    formData.set("flow", flow);
    try {
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-kicker">CMIFF 2026 · OPERATIONS</p>
        <h1>{flow === "signIn" ? "Staff sign-in" : "Create staff account"}</h1>
        <p className="auth-copy">
          The tracker is limited to staff email addresses configured by the
          administrator.
        </p>
        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.org"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={flow === "signIn" ? "current-password" : "new-password"}
              minLength={8}
              required
              placeholder="At least 8 characters"
            />
          </label>
          {flow === "signUp" && (
            <label>
              Staff invitation code
              <input
                name="staffCode"
                type="password"
                autoComplete="off"
                minLength={12}
                required
                placeholder="Provided privately by the administrator"
              />
            </label>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={pending}>
            {pending ? "Please wait…" : flow === "signIn" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setError("");
            setFlow(flow === "signIn" ? "signUp" : "signIn");
          }}
        >
          {flow === "signIn" ? "New staff account? Create one" : "Already registered? Sign in"}
        </button>
      </section>
    </main>
  );
}