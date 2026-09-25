"use client";

import { ErrorContent } from "@/components/states/error-content";

export default function SiteError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorContent {...props} />;
}
