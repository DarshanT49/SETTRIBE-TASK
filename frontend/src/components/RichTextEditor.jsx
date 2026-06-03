import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { useEffect, useCallback } from 'react';

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function ToolbarBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent editor blur
        if (!disabled) onClick();
      }}
      title={title}
      className={`
        px-2 py-1 rounded text-sm font-medium transition-colors select-none
        ${active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
function Toolbar({ editor }) {
  if (!editor) return null;

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:', 'https://');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {/* Headings */}
      <select
        className="text-sm border border-gray-200 rounded px-1 py-1 bg-white text-gray-700 cursor-pointer"
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'p') {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
          }
          e.target.value = 'p'; // reset dropdown
        }}
        defaultValue="p"
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <div className="w-px bg-gray-200 mx-1" />

      {/* Inline marks */}
      <ToolbarBtn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarBtn>

      <div className="w-px bg-gray-200 mx-1" />

      {/* Lists */}
      <ToolbarBtn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        ≡
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        1.
      </ToolbarBtn>

      <div className="w-px bg-gray-200 mx-1" />

      {/* Alignment */}
      <ToolbarBtn
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        ←
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        ↔
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        →
      </ToolbarBtn>

      <div className="w-px bg-gray-200 mx-1" />

      {/* Link & Image */}
      <ToolbarBtn
        active={editor.isActive('link')}
        onClick={addLink}
        title="Insert Link"
      >
        🔗
      </ToolbarBtn>
      <ToolbarBtn
        active={false}
        onClick={addImage}
        title="Insert Image"
      >
        🖼
      </ToolbarBtn>

      <div className="w-px bg-gray-200 mx-1" />

      {/* Undo / Redo */}
      <ToolbarBtn
        active={false}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </ToolbarBtn>
      <ToolbarBtn
        active={false}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo (Ctrl+Y)"
      >
        ↪
      </ToolbarBtn>

      {/* Clear formatting */}
      <ToolbarBtn
        active={false}
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear Formatting"
      >
        ✕
      </ToolbarBtn>
    </div>
  );
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────
/**
 * Production-grade rich text editor built on Tiptap + ProseMirror.
 * Fully compatible with React 19. Drop-in replacement for react-quill.
 *
 * Props:
 *  - value: string  (HTML string)
 *  - onChange: (html: string) => void
 *  - placeholder: string
 *  - style: React.CSSProperties   (applied to the content area)
 *  - className: string
 *  - readOnly: boolean
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write your content here…',
  style,
  className = '',
  readOnly = false,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit includes bulletList, orderedList, listItem, etc.
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
        style: 'min-height: 200px',
      },
    },
    onUpdate({ editor }) {
      // Emit HTML; emit empty string when only a blank paragraph remains
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange?.(html);
    },
  });

  // Sync external value changes (e.g., when inserting a merge tag from outside)
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) {
      // Use 'false' to avoid losing cursor position on normal typing
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden bg-white text-gray-900 ${className}`}
    >
      {!readOnly && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        style={style}
        placeholder={placeholder}
      />
    </div>
  );
}
