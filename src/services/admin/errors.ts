/** A user-facing admin error (optionally tied to a form field). */
export class AdminError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}
