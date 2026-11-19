import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GALLERY_CATEGORIES, MAX_IMAGE_BYTES } from '@/data/gallery';

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImagePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'upload' | 'gallery'>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState(GALLERY_CATEGORIES[0].key);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Подходят только изображения: JPG, PNG, WEBP или GIF.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Файл слишком большой — до 8 МБ.');
      return;
    }
    setUploading(true);
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'jpg';
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('quiz-images').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (upErr) {
      setError('Не удалось загрузить картинку. Попробуйте ещё раз.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('quiz-images').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative w-40 shrink-0 overflow-hidden rounded-xl border border-ink-200">
            <img src={value} alt="Картинка вопроса" className="h-24 w-full object-cover" />
            <button
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded-lg bg-white/90 p-1.5 text-terracotta-600 shadow transition hover:bg-white"
              aria-label="Убрать картинку"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : null}
        <div className="flex-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-600 transition hover:border-pine-300 hover:text-pine-700"
          >
            <ImagePlus size={16} /> {value ? 'Заменить картинку' : 'Добавить картинку'}
          </button>
          <p className="mt-1.5 text-[11px] text-ink-400">С компьютера или из встроенной галереи. Показывается на проекторе во время вопроса.</p>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/60 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-bold text-ink-900"><ImagePlus size={18} className="text-pine-600" /> Выбор картинки</h4>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100" aria-label="Закрыть"><X size={18} /></button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setTab('upload')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${tab === 'upload' ? 'bg-pine-700 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}
              >
                Мой компьютер
              </button>
              <button
                onClick={() => setTab('gallery')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${tab === 'gallery' ? 'bg-pine-700 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}
              >
                Галерея
              </button>
            </div>

            {tab === 'upload' ? (
              <div className="mt-5 rounded-xl border-2 border-dashed border-ink-200 p-8 text-center">
                {uploading ? (
                  <p className="flex items-center justify-center gap-2 text-sm text-ink-500"><Loader2 size={16} className="animate-spin" /> Загружаем…</p>
                ) : (
                  <>
                    <Upload size={28} className="mx-auto text-ink-300" />
                    <p className="mt-3 text-sm font-semibold text-ink-700">Выберите изображение с компьютера</p>
                    <p className="mt-1 text-xs text-ink-400">JPG, PNG, WEBP или GIF · до 8 МБ</p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="mt-4 rounded-xl bg-pine-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-pine-600"
                    >
                      Выбрать файл
                    </button>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                    e.target.value = '';
                  }}
                />
              </div>
            ) : (
              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  {GALLERY_CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setActiveCat(c.key)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${activeCat === c.key ? 'bg-pine-100 text-pine-800' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {GALLERY_CATEGORIES.find((c) => c.key === activeCat)!.images.map((img) => (
                    <button
                      key={img.url}
                      onClick={() => { onChange(img.url); setOpen(false); }}
                      className="group relative overflow-hidden rounded-xl border-2 border-transparent transition hover:border-pine-400"
                    >
                      <img src={img.url} alt={img.label} className="h-24 w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-left text-[10px] font-bold text-white">{img.label}</span>
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pine-600 text-white opacity-0 transition group-hover:opacity-100"><Check size={12} /></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="mt-4 rounded-xl bg-terracotta-50 px-4 py-3 text-sm text-terracotta-700">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
