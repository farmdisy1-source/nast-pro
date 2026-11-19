import { useEffect, useState } from 'react';
import { NotebookPen, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { SectionTitle, Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Meeting = {
  id: string;
  meeting_date: string;
  topic: string;
  decisions: string | null;
};

export default function JournalPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [topic, setTopic] = useState('');
  const [decisions, setDecisions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('meetings')
        .select('id, meeting_date, topic, decisions')
        .order('meeting_date', { ascending: false });
      if (err) {
        setError('Не удалось загрузить журнал собраний.');
      } else {
        setMeetings((data || []) as Meeting[]);
      }
      setLoading(false);
    })();
  }, []);

  const addMeeting = async () => {
    if (!meetingDate || !topic.trim() || saving) return;
    setSaving(true);
    const { data, error: err } = await supabase
      .from('meetings')
      .insert({ meeting_date: meetingDate, topic: topic.trim(), decisions: decisions.trim() || null })
      .select('id, meeting_date, topic, decisions')
      .single();
    if (err || !data) {
      setError('Не удалось сохранить собрание. Проверьте соединение.');
    } else {
      setMeetings((prev) => [data as Meeting, ...prev]);
      setMeetingDate('');
      setTopic('');
      setDecisions('');
    }
    setSaving(false);
  };

  const removeMeeting = async (id: string) => {
    const prev = meetings;
    setMeetings((m) => m.filter((x) => x.id !== id));
    const { error: err } = await supabase.from('meetings').delete().eq('id', id);
    if (err) {
      setMeetings(prev);
      setError('Не удалось удалить запись.');
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Журнал родительских собраний"
        subtitle="Дата, повестка и принятые решения по каждому собранию. К концу года у вас под рукой готовая хронология работы с родителями — для отчёта и анализа."
        mentorTip="Записывайте не только тему, но и конкретные решения: так на следующем собрании легко вернуться к договорённостям и отметить результат."
      />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-5 py-4 text-sm text-gold-700">
          <Info size={18} className="shrink-0" /> {error}
        </div>
      )}

      <Card className="animate-fade-up p-6">
        <h3 className="flex items-center gap-2 font-bold text-ink-900">
          <Plus size={18} className="text-pine-600" /> Новое собрание
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Тема собрания, например: «Адаптация в пятом классе»"
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
          />
          <textarea
            value={decisions}
            onChange={(e) => setDecisions(e.target.value)}
            rows={3}
            placeholder="Повестка и принятые решения"
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100 sm:col-span-2"
          />
        </div>
        <Button onClick={addMeeting} disabled={!meetingDate || !topic.trim() || saving} className="mt-3">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <NotebookPen size={16} />} Сохранить в журнал
        </Button>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-400">
          <Loader2 size={16} className="animate-spin" /> Загрузка…
        </div>
      ) : meetings.length === 0 ? (
        <Card className="p-8 text-center text-sm text-ink-400">
          Журнал пуст. Сохраните первое собрание — записи появятся здесь в обратном хронологическом порядке.
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((m, i) => (
            <Card key={m.id} className={`animate-fade-up delay-${Math.min(i + 1, 6)} p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold text-pine-700">
                    {new Date(m.meeting_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <h3 className="mt-2 font-bold text-ink-900">{m.topic}</h3>
                </div>
                <button
                  onClick={() => removeMeeting(m.id)}
                  className="rounded-lg p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Удалить запись"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {m.decisions && (
                <p className="mt-3 whitespace-pre-line border-l-2 border-pine-200 pl-4 text-sm leading-relaxed text-ink-600">
                  {m.decisions}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
