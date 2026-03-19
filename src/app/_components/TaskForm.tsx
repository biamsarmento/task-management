"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/client";
import type { Task } from "@/server/store";

interface TaskFormProps {
  task?: Task;
  defaultColumnId?: string;
}

export function TaskForm({ task, defaultColumnId }: TaskFormProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  // pre-select the column from the task being edited, or from the url param
  const [columnId, setColumnId] = useState(
    task?.columnId ?? defaultColumnId ?? ""
  );
  const [titleError, setTitleError] = useState("");
  const [columnError, setColumnError] = useState("");

  const { data: columns = [] } = api.tasks.listColumns.useQuery();

  // once columns load, pick the first one if nothing is selected yet
  useEffect(() => {
    if (!columnId && columns.length > 0) {
      setColumnId(columns[0]!.id);
    }
  }, [columns, columnId]);

  const createTask = api.tasks.createTask.useMutation({
    onSuccess: async () => {
      // invalidate both views so whichever the user switches to is fresh
      await Promise.all([
        utils.tasks.listAllTasks.invalidate(),
        utils.tasks.listTasks.invalidate(),
      ]);
      router.push("/");
      router.refresh();
    },
  });

  const updateTask = api.tasks.updateTask.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.tasks.listAllTasks.invalidate(),
        utils.tasks.listTasks.invalidate(),
      ]);
      router.push("/");
      router.refresh();
    },
  });

  const mutation = task ? updateTask : createTask;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;

    if (!title.trim()) {
      setTitleError("Title is required.");
      valid = false;
    } else {
      setTitleError("");
    }

    if (!task && !columnId) {
      setColumnError("Column is required.");
      valid = false;
    } else {
      setColumnError("");
    }

    if (!valid) return;

    if (task) {
      updateTask.mutate({
        id: task.id,
        title: title.trim(),
        description,
        columnId: columnId || undefined,
      });
    } else {
      createTask.mutate({ title: title.trim(), description, columnId });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Back to board
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {task ? "Edit task" : "New task"}
          </h1>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError("");
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Task title"
              />
              {titleError && (
                <p className="mt-1 text-xs text-red-600">{titleError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add a description..."
              />
            </div>

            <div>
              <label
                htmlFor="column"
                className="block text-sm font-medium text-gray-700"
              >
                Column
              </label>
              {columns.length === 0 ? (
                // no columns yet, user needs to create one first
                <p className="mt-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  No columns yet.{" "}
                  <Link href="/" className="underline">
                    Create a column first
                  </Link>{" "}
                  before adding tasks.
                </p>
              ) : (
                <>
                  <select
                    id="column"
                    value={columnId}
                    onChange={(e) => {
                      setColumnId(e.target.value);
                      if (e.target.value) setColumnError("");
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                  {columnError && (
                    <p className="mt-1 text-xs text-red-600">{columnError}</p>
                  )}
                </>
              )}
            </div>

            {mutation.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {mutation.error.message}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Link
                href="/"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={mutation.isPending || (!task && columns.length === 0)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {mutation.isPending
                  ? "Saving..."
                  : task
                    ? "Save changes"
                    : "Create task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
