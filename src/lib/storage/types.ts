export type StoredObject = { key: string; url: string };

/** Where uploaded files live. Implementations: local disk (development/self-hosting) and S3-compatible. */
export interface StorageDriver {
  readonly name: "local" | "s3";
  put(key: string, body: Uint8Array, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  /** Public URL for a stored key. */
  url(key: string): string;
}
