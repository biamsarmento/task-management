// task and column types shared across the app
export interface Column {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId?: string;
  createdAt: Date;
}

// using globalThis so the arrays survive hot-reloads in dev mode,
// otherwise every file change would wipe all data
interface GlobalStore {
  __tasks?: Task[];
  __columns?: Column[];
}

const g = globalThis as unknown as GlobalStore;
const columns: Column[] = g.__columns ?? (g.__columns = []);
const tasks: Task[] = g.__tasks ?? (g.__tasks = []);

export function getAllColumns(): Column[] {
  return columns;
}

export function findColumnById(id: string): Column | undefined {
  return columns.find((c) => c.id === id);
}

export function insertColumn(data: { name: string; color: string }): Column {
  const column: Column = {
    id: crypto.randomUUID(),
    name: data.name,
    color: data.color,
    createdAt: new Date(),
  };
  columns.push(column);
  return column;
}

// also removes all tasks that belong to the column
export function deleteColumnById(id: string): boolean {
  const index = columns.findIndex((c) => c.id === id);
  if (index === -1) return false;
  columns.splice(index, 1);
  const toDelete = tasks.filter((t) => t.columnId === id).map((t) => t.id);
  toDelete.forEach((taskId) => {
    const i = tasks.findIndex((t) => t.id === taskId);
    if (i !== -1) tasks.splice(i, 1);
  });
  return true;
}

export function findTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function insertTask(data: {
  title: string;
  description?: string;
  columnId?: string;
}): Task {
  const task: Task = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    columnId: data.columnId,
    createdAt: new Date(),
  };
  tasks.push(task);
  return task;
}

// only updates fields that are actually provided
export function updateTaskById(
  id: string,
  data: { title?: string; description?: string; columnId?: string }
): Task | undefined {
  const task = findTaskById(id);
  if (!task) return undefined;
  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.columnId !== undefined) task.columnId = data.columnId;
  return task;
}

export function deleteTaskById(id: string): boolean {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}

export function getAllTasks(): Task[] {
  return tasks;
}
