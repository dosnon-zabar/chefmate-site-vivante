"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useToast } from "@/components/ToastProvider";

type Props = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
};

type Mode = "visual" | "source";

export default function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "",
  rows = 4,
}: Props) {
  const [mode, setMode] = useState<Mode>("visual");
  const [htmlContent, setHtmlContent] = useState<string>(defaultValue);
  const { show } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-content focus:outline-none",
      },
    },
  });

  const toggleMode = useCallback(() => {
    if (mode === "visual") {
      // Passer en mode source : récupérer le HTML actuel
      if (editor) {
        setHtmlContent(editor.getHTML());
      }
      setMode("source");
    } else {
      // Retour en mode visual : pousser le HTML éventuellement édité
      if (editor) {
        editor.commands.setContent(htmlContent);
      }
      setMode("visual");
    }
  }, [mode, editor, htmlContent]);

  const pasteWithoutFormat = useCallback(async () => {
    if (!editor) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.chain().focus().insertContent(text).run();
      }
    } catch {
      show("Impossible de lire le presse-papier", "error");
    }
  }, [editor, show]);

  const minHeight = `${Math.max(rows * 24 + 24, 96)}px`;

  return (
    <div className="rounded-lg border border-brun/10 bg-creme overflow-hidden">
      {/* Input hidden pour le FormData */}
      <input type="hidden" name={name} value={mode === "source" ? htmlContent : editor?.getHTML() || htmlContent} />

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-brun/10 bg-white/50">
        <ToolbarButton
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={mode === "source"}
          title="Gras (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={mode === "source"}
          title="Italique (Ctrl+I)"
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={mode === "source"}
          title="Souligné (Ctrl+U)"
        >
          <span className="underline">U</span>
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={mode === "source"}
          title="Liste à puces"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 10h.01M4 14h.01M4 18h.01M8 6h12M8 10h12M8 14h12M8 18h12" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={mode === "source"}
          title="Liste numérotée"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={pasteWithoutFormat}
          disabled={mode === "source"}
          title="Coller sans mise en forme"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          active={mode === "source"}
          onClick={toggleMode}
          title="Afficher le code source HTML"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Contenu : visual ou source */}
      {mode === "visual" ? (
        <div style={{ minHeight }} className="bg-creme">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          style={{ minHeight }}
          className="w-full px-3 py-2.5 bg-creme text-sm text-brun font-mono focus:outline-none resize-none"
          spellCheck={false}
        />
      )}
    </div>
  );
}

type ToolbarButtonProps = {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
};

function ToolbarButton({ children, onClick, active, disabled, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
        active
          ? "bg-orange/20 text-orange"
          : disabled
          ? "text-brun-light/30 cursor-not-allowed"
          : "text-brun-light hover:bg-brun/5 hover:text-brun"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-brun/10 mx-1" />;
}
