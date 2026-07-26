"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  activateWorkspace,
  createWorkspace,
  getWorkspaces,
  type WorkspaceSummary,
  type WorkspaceUser,
} from "@/lib/api";

type WorkspaceContextValue = {
  workspaces: WorkspaceSummary[];
  selectedWorkspace?: WorkspaceSummary;
  user?: WorkspaceUser;
  isLoading: boolean;
  isSwitching: boolean;
  error?: string;
  selectWorkspace: (slug: string) => Promise<void>;
  addWorkspace: (name: string) => Promise<WorkspaceSummary>;
  refreshWorkspaces: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const [user, setUser] = useState<WorkspaceUser>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string>();

  const applyWorkspaces = useCallback(
    (data: Awaited<ReturnType<typeof getWorkspaces>>) => {
      setWorkspaces(data.workspaces);
      setUser(data.user);
      setSelectedSlug((currentSlug) => {
        const nextSlug =
          data.workspaces.find((workspace) => workspace.is_current)
            ?.slug ||
          (currentSlug &&
            data.workspaces.some(
              (workspace) => workspace.slug === currentSlug,
            )
            ? currentSlug
            : undefined) ||
          data.workspaces[0]?.slug;

        return nextSlug || undefined;
      });
    },
    [],
  );

  const loadWorkspaces = useCallback(async () => {
    setError(undefined);

    try {
      const data = await getWorkspaces();
      applyWorkspaces(data);
    } catch {
      setError("Unable to load your workspaces.");
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkspaces]);

  useEffect(() => {
    let active = true;

    getWorkspaces()
      .then((data) => {
        if (active) {
          applyWorkspaces(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load your workspaces.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applyWorkspaces]);

  const selectWorkspace = useCallback(
    async (slug: string) => {
      if (!workspaces.some((workspace) => workspace.slug === slug)) {
        return;
      }

      setError(undefined);
      setIsSwitching(true);

      try {
        await activateWorkspace(slug);
        setWorkspaces((current) =>
          current.map((workspace) => ({
            ...workspace,
            is_current: workspace.slug === slug,
          })),
        );
        setSelectedSlug(slug);
      } catch {
        setError("Unable to switch workspaces. Please try again.");
      } finally {
        setIsSwitching(false);
      }
    },
    [workspaces],
  );

  const addWorkspace = useCallback(
    async (name: string) => {
      const workspace = await createWorkspace(name);
      await loadWorkspaces();
      setSelectedSlug(workspace.slug);
      return workspace;
    },
    [loadWorkspaces],
  );

  const selectedWorkspace = workspaces.find(
    (workspace) => workspace.slug === selectedSlug,
  );
  const value = useMemo(
    () => ({
      workspaces,
      selectedWorkspace,
      user,
      isLoading,
      isSwitching,
      error,
      selectWorkspace,
      addWorkspace,
      refreshWorkspaces: loadWorkspaces,
    }),
    [
      workspaces,
      selectedWorkspace,
      user,
      isLoading,
      isSwitching,
      error,
      addWorkspace,
      loadWorkspaces,
      selectWorkspace,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      "useWorkspaces must be used inside WorkspaceProvider",
    );
  }
  return context;
}
