import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import {
  deleteColumnById,
  deleteTaskById,
  findColumnById,
  findTaskById,
  getAllColumns,
  getAllTasks,
  insertColumn,
  insertTask,
  updateTaskById,
} from "../store";

export const tasksRouter = router({
  // columns are sorted oldest-first so the order stays stable
  listColumns: publicProcedure.query(() => {
    return [...getAllColumns()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }),

  createColumn: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Column name is required"),
        color: z.string().min(1, "Color is required"),
      })
    )
    .mutation(({ input }) => {
      return insertColumn(input);
    }),

  deleteColumn: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const deleted = deleteColumnById(input.id);
      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Column not found" });
      }
      return { success: true };
    }),

  // used by the board view — returns everything at once, no pagination needed there
  listAllTasks: publicProcedure.query(() => {
    return [...getAllTasks()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }),

  // cursor-based pagination for the list view with infinite scroll
  listTasks: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(({ input }) => {
      const { cursor, limit } = input;

      // newest first, with id as tiebreaker to keep order consistent
      const sorted = [...getAllTasks()].sort((a, b) => {
        const diff = b.createdAt.getTime() - a.createdAt.getTime();
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });

      let startIndex = 0;
      if (cursor) {
        const cursorIndex = sorted.findIndex((t) => t.id === cursor);
        startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      }

      // fetch one extra to know if there's a next page
      const slice = sorted.slice(startIndex, startIndex + limit + 1);
      const hasMore = slice.length > limit;
      const items = hasMore ? slice.slice(0, limit) : slice;
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      return { items, nextCursor };
    }),

  getTaskById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const task = findTaskById(input.id);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return task;
    }),

  createTask: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        columnId: z.string().min(1, "Column is required"),
      })
    )
    .mutation(({ input }) => {
      // make sure the column actually exists before creating the task
      const column = findColumnById(input.columnId);
      if (!column) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Column not found",
        });
      }
      return insertTask(input);
    }),

  updateTask: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Title is required").optional(),
        description: z.string().optional(),
        columnId: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      if (input.columnId) {
        const column = findColumnById(input.columnId);
        if (!column) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Column not found",
          });
        }
      }
      const { id, ...data } = input;
      const task = updateTaskById(id, data);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return task;
    }),

  deleteTask: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const deleted = deleteTaskById(input.id);
      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return { success: true };
    }),
});
