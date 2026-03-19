import { notFound } from "next/navigation";
import { api, caller, HydrateClient } from "@/trpc/server";
import { TaskForm } from "@/app/_components/TaskForm";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;

  // fetch the task directly — if it doesn't exist just show 404
  let task;
  try {
    task = await caller.tasks.getTaskById({ id });
  } catch {
    notFound();
  }

  // columns are needed for the select in the form
  await api.tasks.listColumns.prefetch();

  return (
    <HydrateClient>
      <TaskForm task={task} />
    </HydrateClient>
  );
}
