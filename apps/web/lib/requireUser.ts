import { prisma, type Plan } from "@ltp/db";
import { auth } from "@/auth";

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

/**
 * The one place every authenticated route/component gets the current
 * user's id + plan from. Fetches the plan fresh from the database rather
 * than trusting the session token, so a plan change (Phase 11) takes
 * effect on the next request rather than only after re-login.
 */
export async function requireUser(): Promise<{ id: string; email: string; plan: Plan }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthRequiredError();
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, plan: true },
  });
  if (!user) throw new AuthRequiredError();
  return user;
}
