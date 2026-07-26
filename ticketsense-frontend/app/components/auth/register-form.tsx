"use client";

import axios from "axios";
import { type FormikErrors, useFormik } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import {
  ArrowIcon,
  BuildingIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "@/app/components/icons";
import { registerUser, type RegisterPayload } from "@/lib/api";

const initialValues: RegisterPayload = {
  first_name: "",
  last_name: "",
  workspace_name: "",
  email: "",
  password: "",
};

const registerSchema = Yup.object({
  first_name: Yup.string()
    .trim()
    .max(150, "First name must be 150 characters or fewer")
    .required("First name is required"),
  last_name: Yup.string()
    .trim()
    .max(150, "Last name must be 150 characters or fewer")
    .required("Last name is required"),
  workspace_name: Yup.string()
    .trim()
    .max(255, "Workspace name must be 255 characters or fewer"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must contain at least 6 characters")
    .max(128, "Password must be 128 characters or fewer")
    .required("Password is required"),
});

const registerFields = new Set<keyof RegisterPayload>([
  "first_name",
  "last_name",
  "workspace_name",
  "email",
  "password",
]);

type ApiErrors = {
  fieldErrors: FormikErrors<RegisterPayload>;
  generalError?: string;
};

function getMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return getMessage(value[0]);
  }

  if (value && typeof value === "object") {
    if ("detail" in value) {
      return getMessage(value.detail);
    }

    if ("message" in value) {
      return getMessage(value.message);
    }
  }

  return undefined;
}

function getApiErrors(error: unknown): ApiErrors {
  const fieldErrors: FormikErrors<RegisterPayload> = {};

  if (!axios.isAxiosError(error)) {
    return {
      fieldErrors,
      generalError: "Unable to create your account. Please try again.",
    };
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return { fieldErrors, generalError: data };
  }

  if (data && typeof data === "object") {
    if ("errors" in data && Array.isArray(data.errors)) {
      let generalError: string | undefined;

      for (const item of data.errors) {
        if (!item || typeof item !== "object") {
          continue;
        }

        const field =
          "attr" in item && typeof item.attr === "string"
            ? item.attr
            : undefined;
        const message = getMessage(item);

        if (field && registerFields.has(field as keyof RegisterPayload)) {
          fieldErrors[field as keyof RegisterPayload] = message;
        } else if (message && !generalError) {
          generalError = message;
        }
      }

      if (Object.keys(fieldErrors).length > 0 || generalError) {
        return { fieldErrors, generalError };
      }
    }

    let generalError = "detail" in data ? getMessage(data.detail) : undefined;

    for (const [field, value] of Object.entries(data)) {
      const message = getMessage(value);

      if (!message || field === "detail") {
        continue;
      }

      if (registerFields.has(field as keyof RegisterPayload)) {
        fieldErrors[field as keyof RegisterPayload] = message;
      } else if (!generalError) {
        generalError = message;
      }
    }

    if (Object.keys(fieldErrors).length > 0 || generalError) {
      return { fieldErrors, generalError };
    }
  }

  return {
    fieldErrors,
    generalError: "Unable to create your account. Please check your details.",
  };
}

export function RegisterForm() {
  const router = useRouter();
  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, { setErrors, setStatus }) => {
      setStatus(undefined);

      try {
        await registerUser({
          ...values,
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          workspace_name: values.workspace_name.trim(),
          email: values.email.trim(),
        });

        router.push("/login");
      } catch (error) {
        const { fieldErrors, generalError } = getApiErrors(error);
        setErrors(fieldErrors);
        setStatus(generalError);
      }
    },
  });

  return (
    <form className="auth-form" noValidate onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <p
          className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-3 py-2 text-xs leading-5 text-[var(--error)]"
          role="alert"
        >
          {formik.status}
        </p>
      ) : null}

      <div className="field-group">
        <label className="field-label" htmlFor="first_name">
          First name
        </label>
        <div className="field-control">
          <UserIcon className="field-icon" />
          <input
            {...formik.getFieldProps("first_name")}
            aria-describedby={
              formik.touched.first_name && formik.errors.first_name
                ? "first_name-error"
                : undefined
            }
            aria-invalid={
              formik.touched.first_name && Boolean(formik.errors.first_name)
            }
            autoComplete="given-name"
            className={`text-input ${
              formik.touched.first_name && formik.errors.first_name
                ? "border-[var(--error)]"
                : ""
            }`}
            id="first_name"
            placeholder="Alex"
            type="text"
          />
        </div>
        {formik.touched.first_name && formik.errors.first_name ? (
          <p className="text-xs text-[var(--error)]" id="first_name-error">
            {formik.errors.first_name}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="last_name">
          Last name
        </label>
        <div className="field-control">
          <UserIcon className="field-icon" />
          <input
            {...formik.getFieldProps("last_name")}
            aria-describedby={
              formik.touched.last_name && formik.errors.last_name
                ? "last_name-error"
                : undefined
            }
            aria-invalid={
              formik.touched.last_name && Boolean(formik.errors.last_name)
            }
            autoComplete="family-name"
            className={`text-input ${
              formik.touched.last_name && formik.errors.last_name
                ? "border-[var(--error)]"
                : ""
            }`}
            id="last_name"
            placeholder="Morgan"
            type="text"
          />
        </div>
        {formik.touched.last_name && formik.errors.last_name ? (
          <p className="text-xs text-[var(--error)]" id="last_name-error">
            {formik.errors.last_name}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="workspace_name">
          Workspace name
          <span className="ml-1 font-normal text-[var(--outline)]">
            (optional)
          </span>
        </label>
        <div className="field-control">
          <BuildingIcon className="field-icon" />
          <input
            {...formik.getFieldProps("workspace_name")}
            aria-describedby={
              formik.touched.workspace_name &&
              formik.errors.workspace_name
                ? "workspace_name-error"
                : undefined
            }
            aria-invalid={
              formik.touched.workspace_name &&
              Boolean(formik.errors.workspace_name)
            }
            autoComplete="organization"
            className={`text-input ${
              formik.touched.workspace_name &&
              formik.errors.workspace_name
                ? "border-[var(--error)]"
                : ""
            }`}
            id="workspace_name"
            placeholder="Acme, Inc. or Personal Workspace"
            type="text"
          />
        </div>
        {formik.touched.workspace_name &&
        formik.errors.workspace_name ? (
          <p
            className="text-xs text-[var(--error)]"
            id="workspace_name-error"
          >
            {formik.errors.workspace_name}
          </p>
        ) : null}
        <p className="text-[10px] leading-4 text-[var(--outline)]">
          Leave this blank and we’ll create a Personal Workspace for you.
        </p>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="email">
          Work email
        </label>
        <div className="field-control">
          <MailIcon className="field-icon" />
          <input
            {...formik.getFieldProps("email")}
            aria-describedby={
              formik.touched.email && formik.errors.email
                ? "email-error"
                : undefined
            }
            aria-invalid={
              formik.touched.email && Boolean(formik.errors.email)
            }
            autoComplete="email"
            className={`text-input ${
              formik.touched.email && formik.errors.email
                ? "border-[var(--error)]"
                : ""
            }`}
            id="email"
            placeholder="you@example.com"
            type="email"
          />
        </div>
        {formik.touched.email && formik.errors.email ? (
          <p className="text-xs text-[var(--error)]" id="email-error">
            {formik.errors.email}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <div className="field-control">
          <LockIcon className="field-icon" />
          <input
            {...formik.getFieldProps("password")}
            aria-describedby={
              formik.touched.password && formik.errors.password
                ? "password-error"
                : undefined
            }
            aria-invalid={
              formik.touched.password && Boolean(formik.errors.password)
            }
            autoComplete="new-password"
            className={`text-input ${
              formik.touched.password && formik.errors.password
                ? "border-[var(--error)]"
                : ""
            }`}
            id="password"
            placeholder="At least 8 characters"
            type="password"
          />
        </div>
        {formik.touched.password && formik.errors.password ? (
          <p className="text-xs text-[var(--error)]" id="password-error">
            {formik.errors.password}
          </p>
        ) : null}
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

      <button
        aria-busy={formik.isSubmitting}
        className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
        disabled={formik.isSubmitting}
        type="submit"
      >
        {formik.isSubmitting ? "Creating account..." : "Create account"}
        <ArrowIcon height="18" width="18" />
      </button>
    </form>
  );
}
