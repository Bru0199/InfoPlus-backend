/**
 * Thrown when every candidate model failed or returned no usable output.
 * Not the same as a missing/invalid API key (handler maps messages separately).
 */
export class ChatAllModelsFailedError extends Error {
  readonly code = "CHAT_ALL_MODELS_FAILED" as const;

  constructor(
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ChatAllModelsFailedError";
  }
}
