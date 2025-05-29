
import { TRPCError, initTRPC } from "@trpc/server";

import { ZodError } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import superjson from "superjson";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...(shape.data ?? {}),
        zodError:
          error.cause && error.cause instanceof ZodError
            ? (error.cause as ZodError).flatten()
            : null,
      },
    };
  },
});


export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const isAuthenticated = t.middleware(async({ next, ctx}) => {
  //call auth() to get the session
  const session = await auth();

  if(!session || !session.user){
    throw new TRPCError({ code: "UNAUTHORIZED"});
  }

  return next({

    ctx: {
      ...ctx,
      session,
    },
  })
})

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = t.procedure.use(isAuthenticated);

