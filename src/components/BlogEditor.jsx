"use client";

import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

const extensions = [
  StarterKit,
  Placeholder.configure({ placeholder: "Write your blog content..." }),
  Link.configure({ openOnClick: false }),
  Image.configure({ inline: false }),
];

const controls = [
  {
    label: "B",
    command: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    label: "I",
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    label: "H2",
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    label: "H3",
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
  },
  {
    label: "•",
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    label: "1.",
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
];

const BlogEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions,
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && typeof value === "string" && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const actions = useMemo(
    () =>
      controls.map((control) => ({
        ...control,
        run: () => editor && control.command(editor),
        isActive: () => (editor ? control.isActive(editor) : false),
      })),
    [editor]
  );

  if (!editor) {
    return <div className="editor editor--loading">Loading editor...</div>;
  }

  return (
    <div className="editor">
      <div className="editor__toolbar">
        {actions.map((control) => (
          <button key={control.label} type="button" onClick={control.run} className={control.isActive() ? "active" : ""}>
            {control.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default BlogEditor;
