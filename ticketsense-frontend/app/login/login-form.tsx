"use client";

import axios from "axios";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { loginUser, type LoginPayload } from "@/lib/api";

const initialValues: LoginPayload = {
  email: "",
  password: "",
  remember: true,
};

const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must contain at least 6 characters")
    .required("Password is required"),
});

function getLoginError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "Unable to sign in. Please try again.";
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    const detail = "detail" in data ? data.detail : undefined;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && typeof detail[0] === "string") {
      return detail[0];
    }

    for (const value of Object.values(data)) {
      if (typeof value === "string") {
        return value;
      }

      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return "Unable to sign in. Please check your email and password.";
}

export function LoginForm() {
  const router = useRouter();
  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus }) => {
      setStatus(undefined);

      try {
        await loginUser({
          email: values.email.trim(),
          password: values.password,
          remember: values.remember,
        });
        router.replace("/dashboard");
      } catch (requestError) {
        setStatus(getLoginError(requestError));
      }
    },
  });

  return (
    <form className="space-y-5" noValidate onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <p
          className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-3 py-2 text-xs leading-5 text-[var(--error)]"
          role="alert"
        >
          {formik.status}
        </p>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Email address</span>
        <span className="relative block">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)]">
            ✉
          </span>
          <input
            {...formik.getFieldProps("email")}
            aria-describedby={
              formik.touched.email && formik.errors.email
                ? "login-email-error"
                : undefined
            }
            aria-invalid={
              formik.touched.email && Boolean(formik.errors.email)
            }
            autoComplete="email"
            className={`w-full rounded-lg border bg-[var(--surface-container-lowest)] py-3 pl-11 pr-4 text-sm text-[var(--on-surface)] outline-none placeholder:text-[var(--outline)] focus:ring-2 focus:ring-[var(--primary)]/20 ${
              formik.touched.email && formik.errors.email
                ? "border-[var(--error)]"
                : "border-[var(--outline-variant)] focus:border-[var(--primary)]"
            }`}
            name="email"
            type="email"
          />
        </span>
        {formik.touched.email && formik.errors.email ? (
          <span
            className="mt-1 block text-xs text-[var(--error)]"
            id="login-email-error"
          >
            {formik.errors.email}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 flex items-center justify-between text-sm font-medium">
          Password
          <Link
            className="text-xs font-semibold text-[var(--primary)] hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </span>
        <span className="relative block">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)]">
            ▣
          </span>
          <input
            {...formik.getFieldProps("password")}
            aria-describedby={
              formik.touched.password && formik.errors.password
                ? "login-password-error"
                : undefined
            }
            aria-invalid={
              formik.touched.password && Boolean(formik.errors.password)
            }
            autoComplete="current-password"
            className={`w-full rounded-lg border bg-[var(--surface-container-lowest)] py-3 pl-11 pr-4 text-sm text-[var(--on-surface)] outline-none placeholder:text-[var(--outline)] focus:ring-2 focus:ring-[var(--primary)]/20 ${
              formik.touched.password && formik.errors.password
                ? "border-[var(--error)]"
                : "border-[var(--outline-variant)] focus:border-[var(--primary)]"
            }`}
            name="password"
            type="password"
          />
        </span>
        {formik.touched.password && formik.errors.password ? (
          <span
            className="mt-1 block text-xs text-[var(--error)]"
            id="login-password-error"
          >
            {formik.errors.password}
          </span>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
          <input
            {...formik.getFieldProps({
              name: "remember",
              type: "checkbox",
            })}
            className="size-4 accent-[var(--primary-container)]"
            type="checkbox"
          />
          Keep me logged in
        </label>
        <span className="flex items-center gap-2 font-mono text-[9px] text-[var(--success)]">
          ◉ AI security shielding is active
        </span>
      </div>

      <button
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--primary-container)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={formik.isSubmitting}
        type="submit"
      >
        {formik.isSubmitting ? "Signing in…" : "Sign in"}{" "}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
