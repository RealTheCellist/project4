"use client";

import { useEffect, useRef } from "react";
import { sanitizeRichHtml } from "@/lib/rich-text";

interface RichDraftEditorProps {
  value: string;
  onChange: (value: string) => void;
}

type EditorCommand =
  | { type: "command"; command: string; value?: string }
  | { type: "formatBlock"; value: string };

const TOOLBAR_ACTIONS: Array<{
  label: string;
  title: string;
  action: EditorCommand;
  icon: React.ReactNode;
}> = [
  {
    label: "Paragraph",
    title: "Body text",
    action: { type: "formatBlock", value: "p" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6h8a4 4 0 1 1 0 8h-3v4h-2V8H6V6Zm5 2v4h3a2 2 0 1 0 0-4h-3Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Heading",
    title: "Large heading",
    action: { type: "formatBlock", value: "h2" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 6h2v5h5V6h2v12h-2v-5H6v5H4V6Zm12 3h4v1.5l-2.4 2.3c-.5.5-.9.8-1.3 1.2h3.8V16H16v-1.5l2.5-2.4c.4-.4.8-.7 1.2-1.1H16V9Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Quote",
    title: "Quote",
    action: { type: "formatBlock", value: "blockquote" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.5 10A2.5 2.5 0 0 1 10 12.5C10 14 8.9 15.3 7.5 15.8V18H4.8v-2.4A4.7 4.7 0 0 1 7.5 7V10Zm8.5 0a2.5 2.5 0 0 1 2.5 2.5c0 1.5-1.1 2.8-2.5 3.3V18h-2.7v-2.4A4.7 4.7 0 0 1 16 7V10Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Bold",
    title: "Bold",
    action: { type: "command", command: "bold" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 5h6a4 4 0 0 1 2.6 7A4.3 4.3 0 0 1 13 19H7V5Zm2 2v4h4a2 2 0 1 0 0-4H9Zm0 6v4h4a2 2 0 1 0 0-4H9Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Italic",
    title: "Italic",
    action: { type: "command", command: "italic" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M10 5h8v2h-3l-3 10h3v2H7v-2h3l3-10h-3V5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Bullet list",
    title: "Bullet list",
    action: { type: "command", command: "insertUnorderedList" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 7.5A1.5 1.5 0 1 1 5 10.5 1.5 1.5 0 0 1 5 7.5Zm4 1h10v1H9v-1Zm-4 5A1.5 1.5 0 1 1 5 16.5 1.5 1.5 0 0 1 5 13.5Zm4 1h10v1H9v-1Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Warm color",
    title: "Warm color",
    action: { type: "command", command: "foreColor", value: "#ef7d5b" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4 6 18h2.3l1.3-3h4.8l1.3 3H18L12 4Zm-1.5 9 1.5-3.5 1.5 3.5h-3Z"
          fill="currentColor"
        />
        <rect x="7" y="19" width="10" height="2" rx="1" fill="#ef7d5b" />
      </svg>
    ),
  },
  {
    label: "Slate color",
    title: "Slate color",
    action: { type: "command", command: "foreColor", value: "#334155" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4 6 18h2.3l1.3-3h4.8l1.3 3H18L12 4Zm-1.5 9 1.5-3.5 1.5 3.5h-3Z"
          fill="currentColor"
        />
        <rect x="7" y="19" width="10" height="2" rx="1" fill="#334155" />
      </svg>
    ),
  },
  {
    label: "Clear formatting",
    title: "Clear formatting",
    action: { type: "command", command: "removeFormat" },
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6h10v2h-4.1l-1 3H14v2H10l-1.3 4H6.6l1.3-4H5v-2h3.5l1-3H6V6Zm10.7 9.3 1.4 1.4-2 2 2 2-1.4 1.4-2-2-2 2-1.4-1.4 2-2-2-2 1.4-1.4 2 2 2-2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export function RichDraftEditor({ value, onChange }: RichDraftEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "<p></p>";
    }
  }, [value]);

  const syncValue = () => {
    if (!editorRef.current) {
      return;
    }

    onChange(sanitizeRichHtml(editorRef.current.innerHTML));
  };

  const runAction = (action: EditorCommand) => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.focus();

    if (action.type === "formatBlock") {
      document.execCommand("formatBlock", false, action.value);
    } else {
      document.execCommand(action.command, false, action.value);
    }

    syncValue();
  };

  return (
    <div className="editor-shell">
      <div className="editor-toolbar" role="toolbar" aria-label="Draft formatting">
        {TOOLBAR_ACTIONS.map((item) => (
          <button
            key={`${item.label}-${item.title}`}
            className="editor-tool"
            title={item.title}
            aria-label={item.label}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              runAction(item.action);
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        className="draft-editor draft-content"
        contentEditable
        role="textbox"
        aria-label="Draft editor"
        suppressContentEditableWarning
        onInput={syncValue}
        onBlur={syncValue}
        data-placeholder="Start with the version you want a few trusted readers to see."
      />
    </div>
  );
}
