// prefetch columns so the select is ready when the form renders
import { api, HydrateClient } from "@/trpc/server";
import { TaskForm } from "@/app/_components/TaskForm";

interface NewTaskPageProps {
  searchParams: Promise<{ columnId?: string }>;
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const { columnId } = await searchParams;
  await api.tasks.listColumns.prefetch();
  return (
    <HydrateClient>
      {/* pass columnId from url so the right column is pre-selected */}
      <TaskForm defaultColumnId={columnId} />
    </HydrateClient>
  );
}
