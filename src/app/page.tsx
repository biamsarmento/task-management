// prefetch both columns and tasks on the server so the board loads without a spinner
import { api, HydrateClient } from "@/trpc/server";
import { TaskList } from "./_components/TaskList";

export default async function HomePage() {
  await Promise.all([
    api.tasks.listColumns.prefetch(),
    api.tasks.listAllTasks.prefetch(),
  ]);

  return (
    <HydrateClient>
      <TaskList />
    </HydrateClient>
  );
}
