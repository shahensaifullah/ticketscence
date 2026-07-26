"use client";

import axios from "axios";
import { useFormik } from "formik";
import {
  Building2,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  Avatar,
  MetricCard,
  PageHeader,
  Panel,
} from "@/app/components/ui/product-ui";
import {
  getWorkspaceDashboard,
  type WorkspaceDashboard,
} from "@/lib/api";

const workspaceSchema = Yup.object({
  name: Yup.string()
    .trim()
    .max(255, "Workspace name must be 255 characters or fewer")
    .required("Workspace name is required"),
});

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "detail" in data) {
      const detail = data.detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
  }

  return "Unable to complete this request. Please try again.";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function WorkspaceDashboardSummary() {
  const {
    addWorkspace,
    error: workspacesError,
    isLoading: workspacesLoading,
    selectedWorkspace,
  } = useWorkspaces();
  const [loadedDashboard, setLoadedDashboard] =
    useState<WorkspaceDashboard>();
  const [dashboardError, setDashboardError] = useState<string>();
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);

  useEffect(() => {
    let active = true;

    if (!selectedWorkspace) {
      return;
    }

    getWorkspaceDashboard(selectedWorkspace.slug)
      .then((data) => {
        if (active) {
          setDashboardError(undefined);
          setLoadedDashboard(data);
        }
      })
      .catch((error) => {
        if (active) {
          setDashboardError(getErrorMessage(error));
        }
      });

    return () => {
      active = false;
    };
  }, [selectedWorkspace]);

  const formik = useFormik({
    initialValues: { name: "" },
    validationSchema: workspaceSchema,
    onSubmit: async (values, { resetForm, setStatus }) => {
      setStatus(undefined);

      try {
        await addWorkspace(values.name.trim());
        resetForm();
        setShowWorkspaceForm(false);
      } catch (error) {
        setStatus(getErrorMessage(error));
      }
    },
  });
  const dashboard =
    loadedDashboard?.workspace.slug === selectedWorkspace?.slug
      ? loadedDashboard
      : undefined;

  if (workspacesLoading) {
    return (
      <Panel className="p-5">
        <p className="text-sm text-[var(--on-surface-variant)]">
          Loading workspace dashboard…
        </p>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)] hover:bg-[var(--primary-hover)]"
            onClick={() => setShowWorkspaceForm((visible) => !visible)}
            type="button"
          >
            {showWorkspaceForm ? (
              <X aria-hidden="true" size={15} />
            ) : (
              <Plus aria-hidden="true" size={15} />
            )}
            {showWorkspaceForm ? "Cancel" : "Add workspace"}
          </button>
        }
        description={
          dashboard
            ? `You are viewing ${dashboard.workspace.name} as ${dashboard.workspace.role_label}.`
            : "Create or select a workspace to open its dashboard."
        }
        eyebrow={dashboard?.workspace.name ?? "Workspace"}
        title={
          dashboard
            ? `Good morning, ${dashboard.user.name}`
            : "Your workspace dashboard"
        }
      />

      {showWorkspaceForm ? (
        <Panel className="p-5">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
            noValidate
            onSubmit={formik.handleSubmit}
          >
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-xs font-medium">
                Workspace name
              </span>
              <input
                {...formik.getFieldProps("name")}
                className="h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                placeholder="Northstar Labs"
                type="text"
              />
              {formik.touched.name && formik.errors.name ? (
                <span className="mt-1 block text-xs text-[var(--error)]">
                  {formik.errors.name}
                </span>
              ) : null}
              {formik.status ? (
                <span className="mt-1 block text-xs text-[var(--error)]">
                  {formik.status}
                </span>
              ) : null}
            </label>
            <button
              className="mt-6 h-10 rounded-lg bg-[var(--primary-container)] px-4 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-60"
              disabled={formik.isSubmitting}
              type="submit"
            >
              {formik.isSubmitting ? "Creating…" : "Create workspace"}
            </button>
          </form>
        </Panel>
      ) : null}

      {workspacesError || dashboardError ? (
        <p
          className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {workspacesError ?? dashboardError}
        </p>
      ) : null}

      {dashboard ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              change="Your access"
              icon={Building2}
              label="Workspaces"
              value={dashboard.user.workspace_count.toString()}
            />
            <MetricCard
              change="Current workspace"
              icon={Users}
              label="Workspace members"
              tone="tertiary"
              value={dashboard.workspace.member_count.toString()}
            />
            <MetricCard
              change={dashboard.workspace.name}
              icon={ShieldCheck}
              label="Your role"
              tone="success"
              value={dashboard.workspace.role_label}
            />
            <MetricCard
              change={dashboard.user.email}
              icon={UserRound}
              label="Signed-in user"
              value={dashboard.user.name}
            />
          </section>

          <Panel
            description={`${dashboard.workspace.member_count} people have access to this workspace.`}
            title={`${dashboard.workspace.name} members`}
          >
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {dashboard.members.map((member) => (
                <article
                  className="flex items-center gap-3 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3"
                  key={member.uid}
                >
                  <Avatar
                    initials={initials(member.name)}
                    name={member.name}
                    size="md"
                  />
                  <span className="min-w-0">
                    <strong className="block truncate text-xs">
                      {member.name}
                    </strong>
                    <span className="block truncate text-[10px] text-[var(--outline)]">
                      {member.email} · {member.role_label}
                    </span>
                  </span>
                </article>
              ))}
            </div>
          </Panel>
        </>
      ) : null}
    </>
  );
}
