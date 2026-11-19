import { supabase } from '@/lib/supabase';
import type { QuizQuestion } from '@/data/quizzes';

export type ImportedDraft = {
  questions: QuizQuestion[];
  warnings: string[];
};

function normalizeLine(raw: string): string {
  return raw.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}



function cleanQuestion(line: string): string {
  return normalizeLine(line).replace(/^(?:вопрос|питанне)\s*\d*\s*[.:)]\s*/i, '').replace(/^(?:\d+[.)])\s*/, '').trim();
}

export function parseQuizDocument(text: string): ImportedDraft {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);

  const questions: QuizQuestion[] = [];
  let current: { q: string; options: string[]; correct: number | null } | null = null;

  const flush = () => {
    if (!current) return;
    if (current.options.length < 2) {
      warnings.push(`Вопрос «${current.q.slice(0, 60)}…» пропущен: у него меньше двух вариантов ответа.`);
    } else if (current.correct === null) {
      warnings.push(`У вопроса «${current.q.slice(0, 60)}…» не отмечен правильный ответ — отмечен первый вариант.`);
      questions.push({ question: current.q, options: current.options, answerIndex: 0, teacherNote: '' });
    } else {
      questions.push({ question: current.q, options: current.options, answerIndex: current.correct, teacherNote: '' });
    }
    current = null;
  };

  for (const line of lines) {
    const looksLikeQuestion =
      /^(?:вопрос|питанне)\s*\d*\s*[.:)]/i.test(line) || /^\d+[.)]\s+\S/.test(line) || line.endsWith('?');
    const optionMatch = line.match(/^(?:[-–—*•]\s*)?([а-яa-z]\)|\d+[.)]|[A-Z]\))\s+(.+)$/i);
    const markedCorrect = /^\s*(?:\*|[-–—*•]?\s*\+)\s*(.+)$/.exec(line);

    if (optionMatch && current && current.options.length < 6) {
      const label = optionMatch[1];
      const body = normalizeLine(optionMatch[2]);
      const num = parseInt(label, 10);
      const isNumSequence = /^\d+[.)]$/.test(label) && current.options.length === 0 && num !== 1;
      if (isNumSequence && current.q) {
        // "1. Вопрос..." style line misdetected as option earlier — skip
        continue;
      }
      current.options.push(body);
      if (/^\*/.test(line) || /^\s*\+/.test(line)) current.correct = current.options.length - 1;
      void num;
      continue;
    }

    if (markedCorrect && current && current.options.length < 6) {
      current.options.push(normalizeLine(markedCorrect[1]));
      current.correct = current.options.length - 1;
      continue;
    }

    flush();
    const q = cleanQuestion(line);
    if (q && looksLikeQuestion) {
      current = { q, options: [], correct: null };
    } else if (q && !current) {
      current = { q, options: [], correct: null };
    }
  }
  flush();

  if (questions.length === 0) {
    warnings.push('Не удалось распознать ни одного вопроса. Проверьте шаблон: строка «Вопрос: …», ниже варианты, звёздочка (*) перед правильным ответом.');
  }

  return { questions, warnings };
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) return file.text();

  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }

  if (name.endsWith('.doc')) {
    try {
      const mammoth = await import('mammoth');
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return result.value;
    } catch {
      throw new Error('Не удалось прочитать файл .doc. Пересохраните документ в формате .docx — и загрузите снова.');
    }
  }

  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '));
    }
    const text = pages.join('\n');
    if (!text.trim()) {
      throw new Error('В этом PDF нет текстового слоя (похоже, это скан). Вставьте вопросы вручную или используйте файл .docx.');
    }
    return text;
  }

  throw new Error('Поддерживаются файлы .doc, .docx и .pdf.');
}

export async function importQuizFile(file: File): Promise<ImportedDraft> {
  const text = await extractTextFromFile(file);
  return parseQuizDocument(text);
}

export const QUIZ_IMPORT_TEMPLATE = `Вопрос: Какой город является столицей Беларуси?
*Минск
Гродно
Витебск

Вопрос: Сколько будет 7 умножить на 8?
42
+56
64
`;

export async function downloadImportTemplate() {
  const { data } = await supabase.storage.from('quiz-images').getPublicUrl('uploads/.template');
  void data;
  const blob = new Blob(['\ufeff' + QUIZ_IMPORT_TEMPLATE], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Шаблон вопросов для импорта.txt';
  a.click();
  URL.revokeObjectURL(url);
}
