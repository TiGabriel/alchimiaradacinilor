import ReactMarkdown, { type Components } from "react-markdown";

import { cn } from "@/lib/utils";

const components: Components = {
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-sage">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:text-ink-muted">{children}</ol>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="text-ink-muted italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-semibold text-forest underline underline-offset-4 hover:text-forest-deep"
    >
      {children}
    </a>
  ),
  h2: ({ children }) => <h3 className="pt-2 text-xl">{children}</h3>,
  h3: ({ children }) => <h4 className="pt-2 font-display text-lg">{children}</h4>,
};

/** Renders editor Markdown safely (raw HTML is not allowed by react-markdown). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 text-ink/90", className)}>
      <ReactMarkdown components={components} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
