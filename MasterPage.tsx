import { useEffect, useState } from 'react';
import {
  Lightbulb, MessagesSquare, ThumbsUp, Plus, Loader2, Search, Trash2, Send,
  ChevronDown, ChevronUp, AlertTriangle, Quote,
} from 'lucide-react';
import { SectionTitle, Card, Medal, Button, MentorTip } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type ConflictCase = {
  id: string;
  title: string;
  category: string;
  situation: string;
  steps: string[];
  mistake: string;
};

type PeerPost = {
  id: string;
  author_name: string;
  title: string;
  body: string;
  tag: string;
  created_at: string;
  likes: number;
  likedByMe: boolean;
};

const LIKER_KEY_STORAGE = 'pulse-klassa-liker-key';
const AUTHOR_NAME_STORAGE = 'pulse-klassa-author-name';

function getLikerKey(): string {
  let key = localStorage.getItem(LIKER_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(LIKER_KEY_STORAGE, key);
  }
  return key;
}

function CaseCard({ c, index }: { c: ConflictCase; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className={`animate-fade-up overflow-hidden p-0 delay-${Math.min(index + 1, 3)}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-6 text-left">
        <div>
          <span className="inline-flex rounded-full bg-terracotta-100 px-3 py-1 text-[11px] font-bold text-terracotta-700">{c.category}</span>
          <h3 className="mt-2 font-bold text-ink-900">{c.title}</h3>
          {!open && <p className="mt-1 line-clamp-1 text-sm text-ink-500">{c.situation}</p>}
        </div>
        {open ? <ChevronUp size={20} className="shrink-0 text-ink-400" /> : <ChevronDown size={20} className="shrink-0 text-ink-400" />}
      </button>
      {open && (
        <div className="border-t border-ink-100 px-6 pb-6 pt-5">
          <div className="flex gap-3 rounded-xl bg-ink-50 p-4">
            <Quote size={16} className="mt-0.5 shrink-0 text-ink-300" />
            <p className="text-sm leading-relaxed text-ink-600">{c.situation}</p>
          </div>
          <h4 className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-pine-600">Как действовать — по шагам</h4>
          <ol className="mt-3 space-y-2.5">
            {c.steps.map((s, si) => (
              <li key={si} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine-600 text-[11px] font-extrabold text-white">{si + 1}</span>
                <span className="text-sm leading-relaxed text-ink-700">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-gold-200 bg-gold-100/40 px-4 py-3 text-sm leading-relaxed text-ink-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-600" /> Типичная ошибка: {c.mistake}
          </div>
        </div>
      )}
    </Card>
  );
}

function CasesTab() {
  const [cases, setCases] = useState<ConflictCase[]>([]);
  const [category, setCategory] = useState('Все');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.from('conflict_cases').select('*').order('sort_order');
      if (err) setError('Не удалось загрузить кейсы. Попробуйте обновить страницу.');
      else setCases((data || []) as ConflictCase[]);
      setLoading(false);
    })();
  }, []);

  const categories = ['Все', ...Array.from(new Set(cases.map((c) => c.category)))];
  const shown = category === 'Все' ? cases : cases.filter((c) => c.category === category);

  return (
    <div className="space-y-6">
      <MentorTip tip="Кейсы собраны из практики коллег. Разбор читается за две минуты, но работает только в применении: найдите похожую вашу ситуацию и пройдите шаги в предложенном порядке." />
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${category === cat ? 'bg-pine-700 text-white shadow-lift' : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:bg-pine-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-gold-700">{error}</p>}
      {loading ? (
        <Card className="p-6"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка кейсов…</div></Card>
      ) : (
        <div className="space-y-5">
          {shown.map((c, i) => <CaseCard key={c.id} c={c} index={i} />)}
        </div>
      )}
    </div>
  );
}

function ExchangeTab() {
  const [posts, setPosts] = useState<PeerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authorName, setAuthorName] = useState(localStorage.getItem(AUTHOR_NAME_STORAGE) || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const likerKey = getLikerKey();

  useEffect(() => {
    (async () => {
      const [postsRes, likesRes] = await Promise.all([
        supabase.from('peer_posts').select('id, author_name, title, body, tag, created_at').order('created_at', { ascending: false }),
        supabase.from('peer_post_likes').select('post_id, liker_key'),
      ]);
      if (postsRes.error || likesRes.error) {
        setError('Не удалось загрузить публикации. Попробуйте обновить страницу.');
      } else {
        const likes = (likesRes.data || []) as { post_id: string; liker_key: string }[];
        const loaded = ((postsRes.data || []) as Omit<PeerPost, 'likes' | 'likedByMe'>[]).map((p) => ({
          ...p,
          likes: likes.filter((l) => l.post_id === p.id).length,
          likedByMe: likes.some((l) => l.post_id === p.id && l.liker_key === likerKey),
        }));
        setPosts(loaded);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const shown = q
    ? posts.filter((p) => `${p.title} ${p.body} ${p.tag} ${p.author_name}`.toLowerCase().includes(q))
    : posts;

  const publish = async () => {
    if (saving) return;
    if (!authorName.trim() || !title.trim() || !body.trim()) return;
    setSaving(true);
    const { data, error: err } = await supabase
      .from('peer_posts')
      .insert({ author_name: authorName.trim().slice(0, 60), title: title.trim().slice(0, 120), body: body.trim().slice(0, 4000), tag: tag.trim().slice(0, 30) || 'Опыт' })
      .select('id, author_name, title, body, tag, created_at')
      .single();
    if (err || !data) {
      setError('Не удалось опубликовать. Проверьте, что заполнены имя, заголовок и текст.');
    } else {
      localStorage.setItem(AUTHOR_NAME_STORAGE, authorName.trim());
      setPosts((prev) => [{ ...(data as Omit<PeerPost, 'likes' | 'likedByMe'>), likes: 0, likedByMe: false }, ...prev]);
      setTitle('');
      setBody('');
      setTag('');
      setShowForm(false);
      setError(null);
    }
    setSaving(false);
  };

  const toggleLike = async (post: PeerPost) => {
    const wasLiked = post.likedByMe;
    setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, likedByMe: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) } : p)));
    const { error: err } = wasLiked
      ? await supabase.from('peer_post_likes').delete().eq('post_id', post.id).eq('liker_key', likerKey)
      : await supabase.from('peer_post_likes').insert({ post_id: post.id, liker_key: likerKey });
    if (err) {
      setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, likedByMe: wasLiked, likes: p.likes + (wasLiked ? 1 : -1) } : p)));
    }
  };

  const removePost = async (id: string) => {
    const prev = posts;
    setPosts((list) => list.filter((p) => p.id !== id));
    const { error: err } = await supabase.from('peer_posts').delete().eq('id', id);
    if (err) {
      setPosts(prev);
      setError('Не удалось удалить публикацию.');
    }
  };

  return (
    <div className="space-y-6">
      <MentorTip tip="Публикуйте то, что у вас получилось: сценарий, приём, разбор случая. Подписывайтесь именем, псевдонимом или названием методобъединения — личные данные не нужны. Лайки коллег подскажут, какие материалы ценны." />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по публикациям: тема, автор, тег…"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Скрыть форму' : <><Plus size={16} /> Поделиться опытом</>}</Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {showForm && (
        <Card className="animate-fade-up border-pine-200/80 p-6">
          <h3 className="font-bold text-ink-900">Новая публикация</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ваше имя или название методобъединения"
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Тег (например, «Родительское собрание»)"
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
            />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок материала"
            className="mt-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Ваш опыт: в чём была задача, что сделали, что сработало. Численность класса, этапы, результат."
            className="mt-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
          <Button onClick={publish} disabled={saving || !authorName.trim() || !title.trim() || !body.trim()} className="mt-3">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Опубликовать
          </Button>
        </Card>
      )}

      {loading ? (
        <Card className="p-6"><div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Загрузка публикаций…</div></Card>
      ) : shown.length === 0 ? (
        <Card className="p-8 text-center">
          <MessagesSquare size={28} className="mx-auto text-ink-300" />
          <p className="mt-3 text-sm text-ink-500">{query ? 'Ничего не найдено по запросу.' : 'Пока нет публикаций. Станьте первым, кто поделится опытом.'}</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {shown.map((p, i) => (
            <Card key={p.id} className={`animate-fade-up p-6 delay-${Math.min(i + 1, 3)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-pine-50 px-3 py-1 text-[11px] font-bold text-pine-700">{p.tag}</span>
                    <span className="text-xs text-ink-400">{p.author_name} · {new Date(p.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <h3 className="mt-2 font-bold text-ink-900">{p.title}</h3>
                </div>
                <button onClick={() => removePost(p.id)} className="shrink-0 rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label="Удалить публикацию">
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">{p.body}</p>
              <button
                onClick={() => toggleLike(p)}
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${p.likedByMe ? 'bg-pine-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:bg-pine-50'}`}
              >
                <ThumbsUp size={14} /> {p.likes > 0 ? p.likes : 'Полезно'}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MasterPage() {
  const [sub, setSub] = useState<'overview' | 'cases' | 'exchange'>('overview');

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Трек мастера"
        subtitle="Для опытных классных руководителей: банк продвинутых кейсов по разрешению конфликтных ситуаций и площадка обмена опытом, где коллеги публикуют авторские материалы."
        mentorTip="Трек работает в обе стороны: разбирайте кейсы и делитесь тем, что наработали вы. Опыт, оформленный в публикацию, работает на всё методическое сообщество." />

      {sub === 'overview' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            { key: 'cases', icon: Lightbulb, title: 'Банк кейсов конфликтов', desc: 'Шесть и более разобранных ситуаций: с родителями, между учениками, травля, дисциплина. Шаги, типичные ошибки, разбор — по щелчку.' },
            { key: 'exchange', icon: MessagesSquare, title: 'Площадка обмена опытом', desc: 'Публикуйте авторские материалы и приёмы, находите опыт коллег поиском по тегам, отмечайте полезное.' },
          ] as const).map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setSub(s.key)}
                className={`animate-fade-up delay-${i + 1} group flex items-start gap-4 rounded-[1.25rem] border border-ink-200/80 border-l-4 border-l-terracotta-400 bg-white p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-terracotta-300 hover:shadow-lift`}
              >
                <Medal tone="gold"><Icon size={20} /></Medal>
                <span>
                  <span className="block font-bold text-ink-900 group-hover:text-pine-700">{s.title}</span>
                  <span className="mt-1 block text-sm text-ink-500">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSub('overview')} className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-600 transition hover:border-pine-300 hover:bg-pine-50">
              ← Обзор трека
            </button>
            <button
              onClick={() => setSub('cases')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${sub === 'cases' ? 'bg-pine-700 text-white shadow-lift' : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:bg-pine-50'}`}
            >
              <Lightbulb size={14} /> Банк кейсов
            </button>
            <button
              onClick={() => setSub('exchange')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${sub === 'exchange' ? 'bg-pine-700 text-white shadow-lift' : 'border border-ink-200 bg-white text-ink-600 hover:border-pine-300 hover:bg-pine-50'}`}
            >
              <MessagesSquare size={14} /> Обмен опытом
            </button>
          </div>
          {sub === 'cases' && <CasesTab />}
          {sub === 'exchange' && <ExchangeTab />}
        </div>
      )}
    </div>
  );
}
