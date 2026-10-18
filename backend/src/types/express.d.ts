import type { SessionPayload } from "../modules/auth/auth.middleware.js";

declare global {
  namespace Express {
    interface Request {
      /** Session payload attached by `requireAuth` middleware after token verification. */
      session?: SessionPayload;
    }
  }
}
