"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/trpc/client";

interface ColumnRef {
  id: string;
  name: string;
  color: string;
}

interface ListViewProps {
  columns: ColumnRef[];
  setFeedback: (f: { type: "success" | "error"; message: string } | null) => void;
}

export function ListView({ columns, setFeedback }: ListViewProps) {
  // containerRef limits the scroll area to the visible viewport height
  const containerRef = useRef<HTMLDivElement>(null);
  // sentinelRef sits at the bottom of the list and triggers the next page load
  const sentinelRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.tasks.listTasks.useInfiniteQuery(
      { limit: 10 },
      { getNextPageParam: (page) => page.nextCursor }
    );

  const deleteTask = api.tasks.deleteTask.useMutation({
    onSuccess: async () => {
      await utils.tasks.listTasks.invalidate();
      setFeedback({ type: "success", message: "Task deleted." });
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message });
    },
  });

  // watch the sentinel element — when it enters the viewport, load more tasks
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const tasks = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-gray-500">Loading tasks...</p>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-16 text-center">
        <p className="text-sm text-gray-500">No tasks yet.</p>
        <Link
          href="/tasks/new"
          className="mt-2 inline-block text-sm text-blue-600 hover:underline"
        >
          Create your first task
        </Link>
      </div>
    );
  }

  return (
    // fixed height so only the list scrolls, not the whole page
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height: "calc(100vh - 7rem)" }}
    >
      <ul className="space-y-3">
        {tasks.map((task) => {
          const column = columns.find((c) => c.id === task.columnId);
          return (
            <li
              key={task.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {column && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="text-xs text-gray-400">
                        {column.name}
                      </span>
                    </div>
                  )}
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(task.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteTask.mutate({ id: task.id })}
                    disabled={deleteTask.isPending}
                    className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* sentinel — the intersection observer watches this div */}
      <div ref={sentinelRef} className="mt-6 mb-2 flex justify-center">
        {isFetchingNextPage && (
          <p className="text-sm text-gray-500">Loading more...</p>
        )}
        {!hasNextPage && (
          <p className="text-xs text-gray-400">All tasks loaded</p>
        )}
      </div>
    </div>
  );
}
