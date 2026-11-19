import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { studentLink, type StudentLinkKind } from '@/lib/links';

export default function CopyLinkButton({ kind, code, label = 'Скопировать ссылку', className = '' }: {
  kind: StudentLinkKind;
  code?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(studentLink(kind, code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <button
      onClick={() => void copy()}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${className || 'border border-ink-200 bg-white text-pine-700 hover:border-pine-300 hover:bg-pine-50'}`}
      title={studentLink(kind, code)}
    >
      {copied ? <Check size={14} className="text-pine-600" /> : <Link2 size={14} />}
      {copied ? 'Ссылка скопирована' : label}
    </button>
  );
}
