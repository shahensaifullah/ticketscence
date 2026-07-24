import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import {
  ArrowIcon,
  BuildingIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "../components/icons";
import { SsoButtons } from "../components/sso-buttons";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your TicketSense workspace.",
};

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <p className="auth-eyebrow">Get started</p>
      <h1>Create your workspace</h1>
      <p className="auth-subtitle">
        Start organizing support signals in a few minutes.
      </p>

      <form className="auth-form">
        <div className="field-group">
          <label className="field-label" htmlFor="name">
            Full name
          </label>
          <div className="field-control">
            <UserIcon className="field-icon" />
            <input
              className="text-input"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Alex Morgan"
              required
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="company">
            Company
          </label>
          <div className="field-control">
            <BuildingIcon className="field-icon" />
            <input
              className="text-input"
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Acme, Inc."
              required
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="email">
            Work email
          </label>
          <div className="field-control">
            <MailIcon className="field-icon" />
            <input
              className="text-input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <div className="field-control">
            <LockIcon className="field-icon" />
            <input
              className="text-input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </div>
        </div>

        <p className="terms-copy">
          By creating an account, you agree to our{" "}
          <a className="text-link" href="#terms">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="text-link" href="#privacy">
            Privacy Policy
          </a>
          .
        </p>

        <button className="primary-button" type="submit">
          Create account
          <ArrowIcon width="18" height="18" />
        </button>
      </form>

      <SsoButtons />

      <p className="auth-switch">
        Already have an account?
        <Link className="text-link" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
