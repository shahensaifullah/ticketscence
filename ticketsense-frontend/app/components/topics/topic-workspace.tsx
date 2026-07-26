"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageSquareText,
  Paperclip,
  Pin,
  Plus,
  Reply,
  Send,
  Sparkles,
  TicketCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { PageHeader } from "@/app/components/ui/product-ui";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  createTicketFromTopic,
  createTopic,
  createTopicComment,
  deleteTopic,
  getSimilarTopics,
  getTopic,
  getTopics,
  updateTopicSolution,
  uploadTopicAttachment,
  type Topic,
  type TopicDetail,
  type TopicPriority,
  type TopicSuggestion,
  type TopicType,
} from "@/lib/api";

const topicTypeLabels: Record<TopicType, string> = {
  bug: "Bug / problem",
  feature: "Feature request",
  improvement: "Improvement",
  question: "Technical question",
  feedback: "Customer feedback",
  other: "Other",
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TopicWorkspace({
  initialTopicUid,
}: {
  initialTopicUid?: string;
}) {
  const { selectedWorkspace, isLoading: workspaceLoading } =
    useWorkspaces();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | undefined>(
    initialTopicUid,
  );
  const [detail, setDetail] = useState<TopicDetail>();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicType, setTopicType] = useState<TopicType>("bug");
  const [priority, setPriority] = useState<TopicPriority | "">("");
  const [showTicketCreate, setShowTicketCreate] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] =
    useState<TopicPriority>("medium");
  const [showTopicDelete, setShowTopicDelete] = useState(false);
  const [topicDeleteConfirmation, setTopicDeleteConfirmation] =
    useState("");
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [suggestionError, setSuggestionError] = useState<string>();
  const [solution, setSolution] = useState("");
  const [solutionUrl, setSolutionUrl] = useState("");
  const [solutionTicketUid, setSolutionTicketUid] = useState("");
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canCollaborate = selectedWorkspace?.role !== "guest";
  const canCreateTicket =
    selectedWorkspace?.role === "owner" ||
    selectedWorkspace?.role === "admin";

  const loadTopics = useCallback(async () => {
    if (!selectedWorkspace) return;
    const data = await getTopics(selectedWorkspace.slug);
    setTopics(data);
    setSelectedUid((current) => {
      if (current && data.some((item) => item.uid === current)) {
        return current;
      }
      return data[0]?.uid;
    });
  }, [selectedWorkspace]);

  const loadDetail = useCallback(
    async (uid: string) => {
      if (!selectedWorkspace) return;
      const data = await getTopic(selectedWorkspace.slug, uid);
      setDetail(data);
      setSolution(data.solution);
      setSolutionUrl(data.solution_url);
      setSolutionTicketUid(data.solution_ticket?.uid ?? "");
    },
    [selectedWorkspace],
  );

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    getTopics(selectedWorkspace.slug)
      .then((data) => {
        if (!active) return;
        setTopics(data);
        setSelectedUid((current) => {
          if (current && data.some((item) => item.uid === current)) {
            return current;
          }
          return data[0]?.uid;
        });
      })
      .catch(() => {
        if (active) setError("Unable to load Topics.");
      });
    return () => {
      active = false;
    };
  }, [selectedWorkspace]);

  useEffect(() => {
    if (!selectedWorkspace || !selectedUid) return;
    let active = true;
    getTopic(selectedWorkspace.slug, selectedUid)
      .then((data) => {
        if (active) {
          setDetail(data);
          setSolution(data.solution);
          setSolutionUrl(data.solution_url);
          setSolutionTicketUid(data.solution_ticket?.uid ?? "");
        }
      })
      .catch(() => {
        if (active) setError("Unable to load this Topic.");
      });
    return () => {
      active = false;
    };
  }, [selectedUid, selectedWorkspace]);

  useEffect(() => {
    if (!showCreate || !selectedWorkspace) {
      return;
    }
    const query = `${title} ${description}`.trim();
    if (query.length < 4) {
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      getSimilarTopics(selectedWorkspace.slug, {
        title,
        description,
      })
        .then((data) => {
          if (active) {
            setSuggestions(data);
            setSuggestionError(undefined);
          }
        })
        .catch(() => {
          if (active) {
            setSuggestions([]);
            setSuggestionError(
              "Semantic matching is temporarily unavailable.",
            );
          }
        });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [description, selectedWorkspace, showCreate, title]);

  const activeTopic =
    detail?.uid === selectedUid ? detail : undefined;
  const visibleSuggestions =
    `${title} ${description}`.trim().length >= 4
      ? suggestions
      : [];
  const visibleSuggestionError =
    `${title} ${description}`.trim().length >= 4
      ? suggestionError
      : undefined;

  async function refresh() {
    if (!selectedUid) return;
    await Promise.all([loadTopics(), loadDetail(selectedUid)]);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkspace || !title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      const created = await createTopic(selectedWorkspace.slug, {
        title: title.trim(),
        description: description.trim(),
        topic_type: topicType,
        priority: priority || null,
      });
      setTitle("");
      setDescription("");
      setTopicType("bug");
      setPriority("");
      setShowCreate(false);
      await loadTopics();
      setSelectedUid(created.uid);
    } catch {
      setError("Unable to create the Topic.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkspace || !selectedUid || !comment.trim()) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await createTopicComment(
        selectedWorkspace.slug,
        selectedUid,
        comment.trim(),
        replyTo,
      );
      setComment("");
      setReplyTo(undefined);
      await refresh();
    } catch {
      setError("Unable to add the comment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAttachment(file?: File) {
    if (!file || !selectedWorkspace || !selectedUid) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await uploadTopicAttachment(
        selectedWorkspace.slug,
        selectedUid,
        file,
      );
      await refresh();
    } catch {
      setError("Unable to upload the attachment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openTicketCreate() {
    setTicketTitle("");
    setTicketDescription("");
    setTicketPriority(activeTopic?.priority ?? "medium");
    setShowTicketCreate(true);
  }

  async function handleCreateTicket(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (
      !selectedWorkspace ||
      !selectedUid ||
      !ticketTitle.trim() ||
      !ticketDescription.trim()
    ) {
      return;
    }
    setIsSubmitting(true);
    setError(undefined);
    try {
      await createTicketFromTopic(
        selectedWorkspace.slug,
        selectedUid,
        {
          title: ticketTitle.trim(),
          description: ticketDescription.trim(),
          priority: ticketPriority,
        },
      );
      setShowTicketCreate(false);
      setTicketTitle("");
      setTicketDescription("");
      await refresh();
    } catch {
      setError("Unable to create a Ticket from this Topic.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTopic() {
    if (
      !selectedWorkspace ||
      !activeTopic ||
      topicDeleteConfirmation !== activeTopic.title
    ) {
      return;
    }
    setIsSubmitting(true);
    setError(undefined);
    try {
      await deleteTopic(
        selectedWorkspace.slug,
        activeTopic.uid,
        topicDeleteConfirmation,
      );
      setShowTopicDelete(false);
      setTopicDeleteConfirmation("");
      setDetail(undefined);
      await loadTopics();
    } catch {
      setError(
        "Unable to delete this Topic. Check the confirmation and your role.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSolution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkspace || !activeTopic) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await updateTopicSolution(
        selectedWorkspace.slug,
        activeTopic.uid,
        {
          solution: solution.trim(),
          solution_url: solutionUrl.trim(),
          solution_ticket_uid: solutionTicketUid || null,
        },
      );
      await refresh();
    } catch {
      setError(
        "Unable to update the solution. Use a valid URL and a Ticket from this Topic.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <PageHeader
          actions={
            canCollaborate ? (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)]"
                onClick={() => setShowCreate((current) => !current)}
                type="button"
              >
                {showCreate ? <X size={15} /> : <Plus size={15} />}
                {showCreate ? "Cancel" : "New Topic"}
              </button>
            ) : undefined
          }
          description="Explore a problem or idea with the team before creating one or more actionable Tickets."
          eyebrow={selectedWorkspace?.name ?? "Workspace"}
          title="Topics"
        />

        {error ? (
          <p
            className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {showCreate ? (
          <form
            className="grid gap-4 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 lg:grid-cols-2"
            onSubmit={handleCreate}
          >
            {visibleSuggestions.length ? (
              <div className="lg:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                  <Sparkles size={12} />
                  Similar Topics in this organization
                </span>
                <div className="flex flex-wrap gap-2">
                  {visibleSuggestions.map((suggestion) => (
                    <a
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-3 py-1.5 text-xs hover:bg-[var(--primary)]/10"
                      href={`/topics/${suggestion.uid}`}
                      key={suggestion.uid}
                      title={`Open ${suggestion.title}`}
                    >
                      <span className="truncate">{suggestion.title}</span>
                      <span className="shrink-0 text-[9px] capitalize text-[var(--outline)]">
                        {label(suggestion.status)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            {visibleSuggestionError ? (
              <p className="text-xs text-[var(--error)] lg:col-span-2">
                {visibleSuggestionError}
              </p>
            ) : null}
            <input
              className="h-11 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)] lg:col-span-2"
              maxLength={255}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Topic title"
              required
              value={title}
            />
            <select
              className="h-11 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
              onChange={(event) =>
                setTopicType(event.target.value as TopicType)
              }
              value={topicType}
            >
              {Object.entries(topicTypeLabels).map(([value, text]) => (
                <option key={value} value={value}>{text}</option>
              ))}
            </select>
            <select
              className="h-11 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
              onChange={(event) =>
                setPriority(event.target.value as TopicPriority | "")
              }
              value={priority}
            >
              <option value="">No priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <textarea
              className="min-h-28 resize-y rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--primary)] lg:col-span-2"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the problem, idea, question, or feedback…"
              required
              value={description}
            />
            <button
              className="w-fit rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              Create Topic
            </button>
          </form>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]">
            <h2 className="border-b border-[var(--outline-variant)] px-4 py-3 text-xs font-semibold">
              Company Topics
            </h2>
            <div className="max-h-[720px] overflow-y-auto p-2">
              {workspaceLoading ? (
                <p className="p-4 text-sm text-[var(--outline)]">
                  Loading Topics…
                </p>
              ) : topics.length ? (
                topics.map((topic) => (
                  <button
                    className={`mb-1 w-full rounded-lg p-3 text-left ${
                      selectedUid === topic.uid
                        ? "bg-[var(--secondary-container)]"
                        : "hover:bg-[var(--surface-container)]"
                    }`}
                    key={topic.uid}
                    onClick={() => setSelectedUid(topic.uid)}
                    type="button"
                  >
                    <span className="flex items-start gap-2">
                      {topic.is_pinned ? <Pin className="mt-0.5 shrink-0" size={12} /> : null}
                      <strong className="text-sm">{topic.title}</strong>
                    </span>
                    <span className="mt-2 flex justify-between text-[10px] text-[var(--outline)]">
                      <span>{topicTypeLabels[topic.topic_type]}</span>
                      <span>{topic.ticket_count} Tickets</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-[var(--outline)]">
                  No Topics yet.
                </p>
              )}
            </div>
          </aside>

          {activeTopic ? (
            <main className="min-w-0 space-y-5">
              <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-[var(--outline)]">
                      <span>{topicTypeLabels[activeTopic.topic_type]}</span>
                      <span>•</span>
                      <span>{label(activeTopic.status)}</span>
                      {activeTopic.project_name ? (
                        <>
                          <span>•</span>
                          <span>{activeTopic.project_name}</span>
                        </>
                      ) : null}
                      {activeTopic.priority ? (
                        <>
                          <span>•</span>
                          <span>{activeTopic.priority} priority</span>
                        </>
                      ) : null}
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold">
                      {activeTopic.title}
                    </h1>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--on-surface-variant)]">
                      {activeTopic.description}
                    </p>
                  </div>
                  {canCreateTicket ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--error)]/40 px-4 py-2.5 text-xs font-semibold text-[var(--error)] hover:bg-[var(--error)]/10"
                        onClick={() => {
                          setTopicDeleteConfirmation("");
                          setShowTopicDelete(true);
                        }}
                        type="button"
                      >
                        <Trash2 size={15} />
                        Delete Topic
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={openTicketCreate}
                        type="button"
                      >
                        <TicketCheck size={15} />
                        Create Ticket
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>

              <Section
                icon={<CheckCircle2 size={16} />}
                title="Solution"
              >
                {canCreateTicket ? (
                  <form className="space-y-3" onSubmit={handleSolution}>
                    <textarea
                      className="min-h-24 w-full resize-y rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--primary)]"
                      onChange={(event) => setSolution(event.target.value)}
                      placeholder="Describe the agreed solution (optional)."
                      value={solution}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        className="h-11 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
                        onChange={(event) =>
                          setSolutionTicketUid(event.target.value)
                        }
                        value={solutionTicketUid}
                      >
                        <option value="">No solution Ticket</option>
                        {activeTopic.tickets.map((ticket) => (
                          <option key={ticket.uid} value={ticket.uid}>
                            {ticket.reference} — {ticket.title}
                          </option>
                        ))}
                      </select>
                      <input
                        className="h-11 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                        onChange={(event) =>
                          setSolutionUrl(event.target.value)
                        }
                        placeholder="GitHub or project URL (optional)"
                        type="url"
                        value={solutionUrl}
                      />
                    </div>
                    {solutionTicketUid || solutionUrl ? (
                      <div className="flex flex-wrap gap-2">
                        {solutionTicketUid ? (
                          <a
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-xs hover:bg-[var(--surface-container)]"
                            href={`/tickets/${
                              activeTopic.tickets.find(
                                (ticket) =>
                                  ticket.uid === solutionTicketUid,
                              )?.reference ?? ""
                            }`}
                          >
                            <TicketCheck size={12} />
                            Open solution Ticket
                          </a>
                        ) : null}
                        {solutionUrl ? (
                          <a
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-xs hover:bg-[var(--surface-container)]"
                            href={solutionUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <ExternalLink size={12} />
                            Open solution link
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                    <button
                      className="rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-50"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? "Saving…" : "Save Solution"}
                    </button>
                  </form>
                ) : activeTopic.solution ||
                  activeTopic.solution_url ||
                  activeTopic.solution_ticket ? (
                  <div className="space-y-3">
                    {activeTopic.solution ? (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--on-surface-variant)]">
                        {activeTopic.solution}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {activeTopic.solution_ticket ? (
                        <a
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-xs hover:bg-[var(--surface-container)]"
                          href={`/tickets/${activeTopic.solution_ticket.reference}`}
                        >
                          <TicketCheck size={12} />
                          {activeTopic.solution_ticket.reference}
                        </a>
                      ) : null}
                      {activeTopic.solution_url ? (
                        <a
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-xs hover:bg-[var(--surface-container)]"
                          href={activeTopic.solution_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink size={12} />
                          Solution link
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--outline)]">
                    No solution has been recorded yet.
                  </p>
                )}
              </Section>

              <div className="grid gap-5 xl:grid-cols-2">
                <Section icon={<Paperclip size={16} />} title="Attachments">
                  {activeTopic.attachments.length ? (
                    <div className="space-y-2">
                      {activeTopic.attachments.map((attachment) => (
                        <a
                          className="flex items-center gap-3 rounded-lg border border-[var(--outline-variant)] p-3 text-sm hover:bg-[var(--surface-container)]"
                          href={attachment.url}
                          key={attachment.uid}
                        >
                          <FileText size={15} />
                          <span className="min-w-0 flex-1 truncate">
                            {attachment.original_name}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--outline)]">No attachments.</p>
                  )}
                  {canCollaborate && !activeTopic.is_locked ? (
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--primary)]">
                      <Plus size={13} /> Add attachment
                      <input
                        className="sr-only"
                        disabled={isSubmitting}
                        onChange={(event) =>
                          void handleAttachment(event.target.files?.[0])
                        }
                        type="file"
                      />
                    </label>
                  ) : null}
                </Section>

                <Section icon={<Users size={16} />} title="Participants">
                  <div className="flex flex-wrap gap-2">
                    {activeTopic.participants.map((participant) => (
                      <span
                        className="rounded-full bg-[var(--surface-container-high)] px-3 py-1.5 text-xs"
                        key={participant.uid}
                        title={participant.email}
                      >
                        {participant.name}
                      </span>
                    ))}
                  </div>
                </Section>
              </div>

              <Section icon={<TicketCheck size={16} />} title="Tickets from this topic">
                {activeTopic.tickets.length ? (
                  <div className="space-y-2">
                    {activeTopic.tickets.map((ticket) => (
                      <a
                        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--outline-variant)] p-3 hover:bg-[var(--surface-container)]"
                        href={`/tickets/${ticket.reference}`}
                        key={ticket.uid}
                      >
                        <span>
                          <strong className="font-mono text-xs text-[var(--primary)]">
                            {ticket.reference}
                          </strong>
                          <span className="ml-3 text-sm">{ticket.title}</span>
                        </span>
                        <span className="text-[10px] uppercase text-[var(--outline)]">
                          {label(ticket.status)}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--outline)]">
                    No Tickets have been created from this Topic.
                  </p>
                )}
              </Section>

              <Section icon={<MessageSquareText size={16} />} title="Conversation">
                <div className="space-y-3">
                  {activeTopic.comments.map((item) => (
                    <article
                      className={`rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 ${
                        item.parent_uid ? "ml-8" : ""
                      }`}
                      key={item.uid}
                    >
                      <div className="flex justify-between gap-3">
                        <strong className="text-xs">{item.author_name}</strong>
                        <time className="text-[10px] text-[var(--outline)]">
                          {formatDate(item.created_at)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--on-surface-variant)]">
                        {item.body}
                      </p>
                      {canCollaborate && !activeTopic.is_locked ? (
                        <button
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--primary)]"
                          onClick={() => setReplyTo(item.uid)}
                          type="button"
                        >
                          <Reply size={11} /> Reply
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
                {canCollaborate && !activeTopic.is_locked ? (
                  <form className="mt-4" onSubmit={handleComment}>
                    {replyTo ? (
                      <div className="mb-2 flex items-center justify-between rounded bg-[var(--surface-container-high)] px-3 py-2 text-xs">
                        Replying in thread
                        <button onClick={() => setReplyTo(undefined)} type="button">
                          <X size={13} />
                        </button>
                      </div>
                    ) : null}
                    <div className="flex gap-3">
                      <textarea
                        className="min-h-20 flex-1 resize-y rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--primary)]"
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Add a comment. Mention a teammate with @email…"
                        required
                        value={comment}
                      />
                      <button
                        aria-label="Send comment"
                        className="grid size-11 place-items-center rounded-lg bg-[var(--primary-container)] text-[var(--on-primary-container)] disabled:opacity-50"
                        disabled={isSubmitting || !comment.trim()}
                        type="submit"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-4 text-xs text-[var(--outline)]">
                    {activeTopic.is_locked
                      ? "This Topic is locked."
                      : "Guests have read-only access."}
                  </p>
                )}
              </Section>

              <Section icon={<ArrowRight size={16} />} title="Activity history">
                <div className="space-y-3">
                  {activeTopic.activities.map((activity, index) => (
                    <div
                      className="flex items-start justify-between gap-4 border-b border-[var(--outline-variant)] pb-3 text-sm last:border-0"
                      key={`${activity.created_at}-${index}`}
                    >
                      <span>
                        <strong>{activity.actor_name}</strong>{" "}
                        <span className="text-[var(--on-surface-variant)]">
                          {activity.description}
                        </span>
                      </span>
                      <time className="shrink-0 text-[10px] text-[var(--outline)]">
                        {formatDate(activity.created_at)}
                      </time>
                    </div>
                  ))}
                </div>
              </Section>
            </main>
          ) : (
            <div className="grid min-h-[500px] place-items-center rounded-xl border border-[var(--outline-variant)]">
              <p className="text-sm text-[var(--outline)]">
                Select a Topic to view its details.
              </p>
            </div>
          )}
        </div>
      </div>
      {showTicketCreate && activeTopic ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isSubmitting) {
              setShowTicketCreate(false);
            }
          }}
        >
          <form
            aria-labelledby="create-ticket-title"
            aria-modal="true"
            className="w-full max-w-xl rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-6 shadow-2xl"
            onSubmit={handleCreateTicket}
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-semibold"
                  id="create-ticket-title"
                >
                  Create Ticket
                </h2>
                <p className="mt-1 text-xs text-[var(--outline)]">
                  From Topic: {activeTopic.title}
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-[var(--surface-container)]"
                disabled={isSubmitting}
                onClick={() => setShowTicketCreate(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>

            <label className="block text-xs font-semibold">
              Ticket name
              <input
                autoFocus
                className="mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                maxLength={255}
                onChange={(event) => setTicketTitle(event.target.value)}
                placeholder="A specific piece of work"
                required
                value={ticketTitle}
              />
            </label>

            <label className="mt-4 block text-xs font-semibold">
              Priority
              <select
                className="mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
                onChange={(event) =>
                  setTicketPriority(event.target.value as TopicPriority)
                }
                value={ticketPriority}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className="mt-4 block text-xs font-semibold">
              Description
              <textarea
                className="mt-2 min-h-32 w-full resize-y rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--primary)]"
                onChange={(event) =>
                  setTicketDescription(event.target.value)
                }
                placeholder="Describe what this Ticket must solve or deliver."
                required
                value={ticketDescription}
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-[var(--outline-variant)] px-4 py-2.5 text-xs font-semibold"
                disabled={isSubmitting}
                onClick={() => setShowTicketCreate(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-50"
                disabled={
                  isSubmitting ||
                  !ticketTitle.trim() ||
                  !ticketDescription.trim()
                }
                type="submit"
              >
                {isSubmitting ? "Creating…" : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {showTopicDelete && activeTopic ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isSubmitting) {
              setShowTopicDelete(false);
            }
          }}
        >
          <section
            aria-labelledby="delete-topic-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl border border-[var(--error)]/40 bg-[var(--surface-container-lowest)] p-6 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="mt-0.5 text-[var(--error)]">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <h2
                    className="text-lg font-semibold"
                    id="delete-topic-title"
                  >
                    Delete Topic
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--on-surface-variant)]">
                    Related Tickets will remain on the board, but this
                    Topic will no longer appear in Topics.
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-[var(--surface-container)]"
                disabled={isSubmitting}
                onClick={() => setShowTopicDelete(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold">
              Type{" "}
              <strong className="break-all text-[var(--error)]">
                {activeTopic.title}
              </strong>{" "}
              to confirm
              <input
                autoComplete="off"
                autoFocus
                className="mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--error)]"
                onChange={(event) =>
                  setTopicDeleteConfirmation(event.target.value)
                }
                value={topicDeleteConfirmation}
              />
            </label>

            <button
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--error)] px-4 py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={
                isSubmitting ||
                topicDeleteConfirmation !== activeTopic.title
              }
              onClick={() => void handleDeleteTopic()}
              type="button"
            >
              <Trash2 size={14} />
              {isSubmitting ? "Deleting…" : "Delete this Topic"}
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <span className="text-[var(--primary)]">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
