export type StoredObject = { key: string; url: string };

/** Where uploaded files live: local disk (development/self-hosting), S3-compatible or Netlify Blobs. */
export interface StorageDriver {
  readonly name: "local" | "s3" | "netlify";
  put(key: string, body: Uint8Array, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  /** Public URL for a stored key. */
  url(key: string): string;
}
