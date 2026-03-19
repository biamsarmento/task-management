"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/client";
import { ListView } from "./ListView";

// available colors for column headers
const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#0f172a",
];

interface Feedback {
  type: "success" | "error";
  message: string;
}

export function TaskList() {
  const [view, setView] = useState<"board" | "list">("board");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [columnColor, setColumnColor] = useState(COLORS[5]);
  const [columnNameError, setColumnNameError] = useState("");

  const utils = api.useUtils();

  const { data: columns = [] } = api.tasks.listColumns.useQuery();
  const { data: tasks = [] } = api.tasks.listAllTasks.useQuery();

  // invalidate the relevant cache when switching views so data is always fresh
  async function switchView(next: "board" | "list") {
    if (next === "board") {
      await utils.tasks.listAllTasks.invalidate();
    } else {
      await utils.tasks.listTasks.invalidate();
    }
    setView(next);
  }

  const createColumn = api.tasks.createColumn.useMutation({
    onSuccess: async () => {
      await utils.tasks.listColumns.invalidate();
      setShowColumnForm(false);
      setColumnName("");
      setColumnColor(COLORS[5]);
      setColumnNameError("");
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message });
    },
  });

  const deleteColumn = api.tasks.deleteColumn.useMutation({
    onSuccess: async () => {
      await utils.tasks.listColumns.invalidate();
      await utils.tasks.listAllTasks.invalidate();
      setFeedback({ type: "success", message: "Column deleted." });
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message });
    },
  });

  const deleteTask = api.tasks.deleteTask.useMutation({
    onSuccess: async () => {
      await utils.tasks.listAllTasks.invalidate();
      setFeedback({ type: "success", message: "Task deleted." });
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message });
    },
  });

  // auto-dismiss feedback after 3 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function handleCreateColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!columnName.trim()) {
      setColumnNameError("Column name is required.");
      return;
    }
    setColumnNameError("");
    createColumn.mutate({ name: columnName.trim(), color: columnColor });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* top banner for success/error messages */}
      {feedback && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium text-white ${
            feedback.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            {/* view toggle */}
            <div className="flex overflow-hidden rounded-md border border-gray-200">
              <button
                onClick={() => void switchView("board")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "board"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Board
              </button>
              <button
                onClick={() => void switchView("list")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                List
              </button>
            </div>
          </div>
          <Link
            href="/tasks/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            New task
          </Link>
        </div>

        {view === "list" && (
          <ListView columns={columns} setFeedback={setFeedback} />
        )}

        {view === "board" && columns.length === 0 && !showColumnForm && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-500">No columns yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Create a column to start organizing your tasks.
            </p>
            <button
              onClick={() => setShowColumnForm(true)}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create first column
            </button>
          </div>
        )}

        {view === "board" && <div className="flex items-start gap-4 overflow-x-auto pb-6">
          {columns.map((column) => {
            const columnTasks = tasks.filter((t) => t.columnId === column.id);
            return (
              <div
                key={column.id}
                className="flex w-72 shrink-0 flex-col rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div
                  className="flex items-center justify-between rounded-t-lg px-4 py-3"
                  style={{ borderTop: `4px solid ${column.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="font-semibold text-gray-800">
                      {column.name}
                    </span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteColumn.mutate({ id: column.id })}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 focus:outline-none"
                    title="Delete column"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-2 p-3">
                  {columnTasks.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-400">
                      No tasks
                    </p>
                  )}
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-md border border-gray-100 bg-gray-50 p-3"
                    >
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
                      <div className="mt-3 flex justify-end gap-2">
                        <Link
                          href={`/tasks/${task.id}/edit`}
                          className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteTask.mutate({ id: task.id })}
                          disabled={deleteTask.isPending}
                          className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 p-3">
                  <Link
                    href={`/tasks/new?columnId=${column.id}`}
                    className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  >
                    <span className="text-lg leading-none">+</span>
                    Add task
                  </Link>
                </div>
              </div>
            );
          })}

          {/* inline form to create a new column */}
          {showColumnForm ? (
            <div className="w-72 shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <form onSubmit={handleCreateColumn} className="space-y-3">
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => {
                    setColumnName(e.target.value);
                    if (e.target.value.trim()) setColumnNameError("");
                  }}
                  placeholder="Column name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                {columnNameError && (
                  <p className="text-xs text-red-600">{columnNameError}</p>
                )}
                {/* color picker — just a row of swatches */}
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColumnColor(color)}
                      className="h-6 w-6 rounded-full focus:outline-none"
                      style={{
                        backgroundColor: color,
                        boxShadow:
                          columnColor === color
                            ? `0 0 0 2px white, 0 0 0 4px ${color}`
                            : "none",
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createColumn.isPending}
                    className="flex-1 rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {createColumn.isPending ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowColumnForm(false);
                      setColumnName("");
                      setColumnNameError("");
                    }}
                    className="flex-1 rounded-md border border-gray-300 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            columns.length > 0 && (
              <button
                onClick={() => setShowColumnForm(true)}
                className="flex h-12 w-72 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500"
              >
                <span className="text-lg leading-none">+</span>
                Add column
              </button>
            )
          )}
        </div>}
      </div>
    </div>
  );
}
