export default function MarkdownText({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return (
    <div className="text-sm text-navy-700 space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <p key={i} className="font-display text-base text-navy-900 mt-2">
              {line.replace(/^##\s*/, "")}
            </p>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <p key={i} className="font-display text-lg text-navy-900">
              {line.replace(/^#\s*/, "")}
            </p>
          );
        }
        if (!line.trim()) return null;
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
