import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-p:my-2 prose-li:my-0.5 prose-table:text-xs prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-th:text-left prose-th:font-semibold prose-table:border prose-table:border-border prose-th:border prose-th:border-border prose-td:border prose-td:border-border">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
