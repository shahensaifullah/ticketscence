"use client";

import axios from "axios";
import { useFormik } from "formik";
import {
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Yup from "yup";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  Avatar,
  MetricCard,
  PageHeader,
  Panel,
} from "@/app/components/ui/product-ui";
import {
  createWorkspaceMember,
  getWorkspaceDashboard,
  type CreateMemberPayload,
  type WorkspaceDashboard,
} from "@/lib/api";

const memberSchema = Yup.object({
  first_name: Yup.string()
    .trim()
    .max(150, "First name must be 150 characters or fewer")
    .required("First name is required"),
  last_name: Yup.string()
    .trim()
    .max(150, "Last name must be 150 characters or fewer")
    .required("Last name is required"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must contain at least 8 characters")
    .max(128, "Password must be 128 characters or fewer")
    .required("Password is required"),
  role: Yup.string().required("Role is required"),
});

const initialValues: CreateMemberPayload = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "member",
};

function getMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return getMessage(value[0]);
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      const message = getMessage(child);
      if (message) {
        return message;
      }
    }
  }

  return undefined;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      getMessage(error.response?.data) ??
      "Unable to add this workspace member."
    );
  }

  return "Unable to add this workspace member.";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TeamWorkspace() {
  const { selectedWorkspace } = useWorkspaces();
  const [loadedDashboard, setLoadedDashboard] =
    useState<WorkspaceDashboard>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [search, setSearch] = useState("");
  const [showMemberForm, setShowMemberForm] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!selectedWorkspace) {
      setLoadedDashboard(undefined);
      return;
    }

    setError(undefined);
    try {
      setLoadedDashboard(
        await getWorkspaceDashboard(selectedWorkspace.slug),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    let active = true;

    if (!selectedWorkspace) {
      return;
    }

    getWorkspaceDashboard(selectedWorkspace.slug)
      .then((data) => {
        if (active) {
          setError(undefined);
          setLoadedDashboard(data);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(getErrorMessage(requestError));
        }
      });

    return () => {
      active = false;
    };
  }, [selectedWorkspace]);

  const formik = useFormik({
    initialValues,
    validationSchema: memberSchema,
    onSubmit: async (values, { resetForm, setStatus }) => {
      if (!selectedWorkspace) {
        return;
      }

      setStatus(undefined);
      setNotice(undefined);

      try {
        const response = await createWorkspaceMember(
          selectedWorkspace.slug,
          {
            ...values,
            first_name: values.first_name.trim(),
            last_name: values.last_name.trim(),
            email: values.email.trim(),
          },
        );
        resetForm();
        setShowMemberForm(false);
        setNotice(
          response.email_sent
            ? `${response.member.name} was added and notified by email.`
            : `${response.member.name} was added, but the email could not be sent.`,
        );
        await loadDashboard();
      } catch (requestError) {
        setStatus(getErrorMessage(requestError));
      }
    },
  });
  const dashboard =
    loadedDashboard?.workspace.slug === selectedWorkspace?.slug
      ? loadedDashboard
      : undefined;

  const members = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return dashboard?.members ?? [];
    }

    return (dashboard?.members ?? []).filter((member) =>
      [member.name, member.email, member.role_label].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [dashboard, search]);

  const roles =
    dashboard?.available_roles.filter(
      (role) => role.value !== "owner",
    ) ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <PageHeader
          actions={
            dashboard?.workspace.can_manage_members ? (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)]"
                onClick={() => setShowMemberForm((visible) => !visible)}
                type="button"
              >
                {showMemberForm ? (
                  <X aria-hidden="true" size={15} />
                ) : (
                  <Plus aria-hidden="true" size={15} />
                )}
                {showMemberForm ? "Cancel" : "Add member"}
              </button>
            ) : undefined
          }
          description="Manage workspace access and role assignments. Owners and Admins can add members."
          eyebrow={
            dashboard
              ? `${dashboard.workspace.name} · ${dashboard.workspace.member_count} members`
              : "Workspace team"
          }
          title="Team"
        />

        {error ? (
          <p
            className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            className="rounded-lg border border-[var(--success)]/35 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        {showMemberForm && dashboard ? (
          <Panel
            description={`The member will receive sign-in instructions for ${dashboard.workspace.name}.`}
            title="Add workspace member"
          >
            <form
              className="grid gap-4 p-5 md:grid-cols-2"
              noValidate
              onSubmit={formik.handleSubmit}
            >
              {(
                [
                  ["first_name", "First name", "Alex", "text"],
                  ["last_name", "Last name", "Morgan", "text"],
                  ["email", "Email", "alex@example.com", "email"],
                  ["password", "Temporary password", "", "password"],
                ] as const
              ).map(([name, label, placeholder, type]) => (
                <label className="block" key={name}>
                  <span className="mb-2 block text-xs font-medium">
                    {label}
                  </span>
                  <input
                    {...formik.getFieldProps(name)}
                    autoComplete={type === "password" ? "new-password" : "off"}
                    className="h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder={placeholder}
                    type={type}
                  />
                  {formik.touched[name] && formik.errors[name] ? (
                    <span className="mt-1 block text-xs text-[var(--error)]">
                      {formik.errors[name]}
                    </span>
                  ) : null}
                </label>
              ))}

              <label className="block">
                <span className="mb-2 block text-xs font-medium">Role</span>
                <select
                  {...formik.getFieldProps("role")}
                  className="h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end md:justify-end">
                <button
                  className="h-10 w-full rounded-lg bg-[var(--primary-container)] px-4 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-60 md:w-auto"
                  disabled={formik.isSubmitting}
                  type="submit"
                >
                  {formik.isSubmitting ? "Adding member…" : "Add and notify"}
                </button>
              </div>

              {formik.status ? (
                <p
                  className="text-xs text-[var(--error)] md:col-span-2"
                  role="alert"
                >
                  {formik.status}
                </p>
              ) : null}
            </form>
          </Panel>
        ) : null}

        {dashboard ? (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                change={dashboard.workspace.name}
                icon={Users}
                label="Active members"
                value={dashboard.workspace.member_count.toString()}
              />
              <MetricCard
                change="Your workspace access"
                icon={ShieldCheck}
                label="Your role"
                tone="success"
                value={dashboard.workspace.role_label}
              />
              <MetricCard
                change={`${dashboard.user.workspace_count} total workspaces`}
                icon={UserCheck}
                label="Signed-in user"
                tone="tertiary"
                value={dashboard.user.name}
              />
            </section>

            <Panel>
              <div className="flex flex-col gap-3 border-b border-[var(--outline-variant)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Workspace members</h2>
                  <p className="mt-1 text-xs text-[var(--outline)]">
                    Roles are scoped to {dashboard.workspace.name}.
                  </p>
                </div>
                <label className="relative block w-full sm:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--outline)]"
                    size={14}
                  />
                  <span className="sr-only">Search members</span>
                  <input
                    className="h-9 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-9 pr-3 text-xs outline-none"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search members…"
                    type="search"
                    value={search}
                  />
                </label>
              </div>
              <div className="divide-y divide-[var(--outline-variant)]">
                {members.map((member) => (
                  <article
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center"
                    key={member.uid}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        initials={initials(member.name)}
                        name={member.name}
                        size="lg"
                      />
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">
                          {member.name}
                        </strong>
                        <span className="flex items-center gap-1 truncate text-[10px] text-[var(--outline)]">
                          <Mail aria-hidden="true" size={11} />
                          {member.email}
                        </span>
                      </span>
                    </div>
                    <span className="w-fit rounded-full bg-[var(--surface-container-high)] px-2.5 py-1 text-[10px] font-medium text-[var(--on-surface-variant)] sm:justify-self-end">
                      {member.role_label}
                    </span>
                  </article>
                ))}
                {members.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-[var(--outline)]">
                    No members match your search.
                  </p>
                ) : null}
              </div>
            </Panel>
          </>
        ) : null}
      </div>
    </div>
  );
}
