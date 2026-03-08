import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { ArticleListItem } from '../types';
import { articleApi } from '../api';
import { formatDate, getImageUrl } from '../utils/format';

const STATUS_BADGE: Record<string, string> = {
  Published: 'bg-green-100 text-green-700',
  Draft:     'bg-amber-100 text-amber-700',
  Archived:  'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  Published: '✅ เผยแพร่แล้ว',
  Draft:     '📝 ร่าง',
  Archived:  '📦 เก็บถาวร',
};

export function MyArticlesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [articles,   setArticles]   = useState<ArticleListItem[]>([]);
  const [filter,     setFilter]     = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats,      setStats]      = useState({ total: 0, published: 0, draft: 0 });
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [msgType,    setMsgType]    = useState<'ok' | 'err'>('ok');

  const load = async () => {
    setLoading(true);
    try {
      const res = await articleApi.getMine({ page, pageSize: 10, status: filter || undefined });
      setArticles(res.items);
      setTotalPages(res.totalPages);

      // โหลด stats
      const [all, pub, dft] = await Promise.all([
        articleApi.getMine({ page: 1, pageSize: 1 }),
        articleApi.getMine({ page: 1, pageSize: 1, status: 'Published' }),
        articleApi.getMine({ page: 1, pageSize: 1, status: 'Draft' }),
      ]);
      setStats({ total: all.totalCount, published: pub.totalCount, draft: dft.totalCount });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filter]);

  const notify = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const handlePublish = async (id: number) => {
    try { await articleApi.publish(id); notify('เผยแพร่สำเร็จ ✅'); load(); }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'err'); }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`ลบบทความ "${title}" ?`)) return;
    try { await articleApi.delete(id); notify('ลบสำเร็จ ✅'); load(); }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'err'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1"
            style={{ fontFamily: "'DM Mono',monospace" }}>
            {user?.username} · {user?.role}
          </p>
          <h1 className="text-3xl font-black text-slate-900"
            style={{ fontFamily: "'Playfair Display',serif" }}>
            โพสต์ของฉัน
          </h1>
        </div>
        <Link to="/create"
          className="bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition-colors text-sm">
          + เขียนข่าวใหม่
        </Link>
      </div>

      {/* Notification */}
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl mb-6 border ${
          msgType === 'ok'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'ทั้งหมด',      value: stats.total,     icon: '📰', cls: 'bg-sky-50 border-sky-200 text-sky-700' },
          { label: 'เผยแพร่แล้ว', value: stats.published, icon: '✅', cls: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'ฉบับร่าง',    value: stats.draft,     icon: '📝', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-5 ${s.cls}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-sm font-medium opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: '',          label: 'ทั้งหมด' },
          { key: 'Published', label: '✅ เผยแพร่' },
          { key: 'Draft',     label: '📝 ร่าง' },
          { key: 'Archived',  label: '📦 เก็บถาวร' },
        ].map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Article list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-lg font-medium">ยังไม่มีบทความ</p>
          <Link to="/create" className="mt-3 inline-block text-sm text-amber-600 hover:underline">
            เขียนข่าวแรกของคุณ →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <div key={a.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-shadow">

              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                {a.thumbnailUrl ? (
                  <img src={getImageUrl(a.thumbnailUrl)} alt={a.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📰</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[a.status] ?? ''}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {a.categoryName}
                  </span>
                </div>
                <Link to={`/articles/${a.slug}`}
                  className="font-bold text-slate-900 hover:text-amber-700 transition-colors line-clamp-1 block">
                  {a.title}
                </Link>
                <p className="text-xs text-slate-400 mt-1"
                  style={{ fontFamily: "'DM Mono',monospace" }}>
                  {formatDate(a.publishedAt ?? a.createdAt)}
                  {a.viewCount > 0 && ` · 👁 ${a.viewCount}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {a.status === 'Draft' && (
                  <button onClick={() => handlePublish(a.id)}
                    className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors font-semibold">
                    🚀 เผยแพร่
                  </button>
                )}
                <button onClick={() => navigate(`/create?edit=${a.slug}`)}
                  className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:border-amber-400 hover:text-amber-600 transition-colors">
                  ✏️ แก้ไข
                </button>
                <button onClick={() => handleDelete(a.id, a.title)}
                  className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-8">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium ${
                page === p ? 'bg-slate-900 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>
              {p}
            </button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">
            →
          </button>
        </div>
      )}
    </div>
  );
}
