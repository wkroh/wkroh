import { useRef, useCallback } from "react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

type FormatAction = {
  label: string;
  icon: string;
  wrap?: [string, string];
  prefix?: string;
};

const ACTIONS: FormatAction[] = [
  { label: "غامق", icon: "B", wrap: ["**", "**"] },
  { label: "مائل", icon: "𝐼", wrap: ["*", "*"] },
  { label: "يتوسطه خط", icon: "S̶", wrap: ["~~", "~~"] },
  { label: "كود", icon: "</>", wrap: ["`", "`"] },
  { label: "رابط", icon: "🔗", wrap: ["[", "](url)"] },
  { label: "عنوان", icon: "H", prefix: "# " },
  { label: "اقتباس", icon: "❝", prefix: "> " },
  { label: "قائمة", icon: "•", prefix: "- " },
  { label: "قائمة مرقمة", icon: "1.", prefix: "1. " },
  { label: "كود بلوك", icon: "{ }", wrap: ["\n```\n", "\n```\n"] },
];

const MarkdownToolbar = ({ textareaRef, value, onChange }: MarkdownToolbarProps) => {
  const applyFormat = useCallback(
    (action: FormatAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);

      let newValue: string;
      let cursorPos: number;

      if (action.wrap) {
        const [before, after] = action.wrap;
        newValue = value.substring(0, start) + before + selected + after + value.substring(end);
        cursorPos = selected ? start + before.length + selected.length + after.length : start + before.length;
      } else if (action.prefix) {
        // Apply prefix to each line if multiline selection, or current line
        if (selected) {
          const prefixed = selected
            .split("\n")
            .map((line) => action.prefix + line)
            .join("\n");
          newValue = value.substring(0, start) + prefixed + value.substring(end);
          cursorPos = start + prefixed.length;
        } else {
          newValue = value.substring(0, start) + action.prefix + value.substring(end);
          cursorPos = start + action.prefix!.length;
        }
      } else {
        return;
      }

      onChange(newValue);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [textareaRef, value, onChange]
  );

  return (
    <div className="flex gap-0.5 flex-wrap border-b border-border pb-2 mb-2">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => applyFormat(action)}
          title={action.label}
          className="px-2 py-1 rounded text-xs font-medium bg-secondary/60 text-secondary-foreground hover:bg-secondary transition-colors min-w-[28px]"
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};

export default MarkdownToolbar;
