import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { ArticleListItem } from '../../types';
import { articleApi } from '../../api';
import { formatDate } from '../../utils/format';

const STATUS_BADGE: Record<string, string> = {
  Published: 'bg-green-100 text-green-700',
  Draft:     'bg-amber-100 text-amber-700',
  Archived:  'bg-slate-100 text-slate-600',
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [articles,    setArticles]    = useState<ArticleListItem[]>([]);
  const [stats,       setStats]       = useState({ total: 0, published: 0, draft: 0, archived: 0 });
  const [filter,      setFilter]      = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [actionMsg,   setActionMsg]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await articleApi.getAllAdmin({ page, pageSize: 10, status: filter || undefined });
      setArticles(res.items);
      setTotalPages(res.totalPages);
      const [all, pub, dft, arc] = await Promise.all([
        articleApi.getAllAdmin({ page: 1, pageSize: 1 }),
        articleApi.getAllAdmin({ page: 1, pageSize: 1, status: 'Published' }),
        articleApi.getAllAdmin({ page: 1, pageSize: 1, status: 'Draft' }),
        articleApi.getAllAdmin({ page: 1, pageSize: 1, status: 'Archived' }),
      ]);
      setStats({ total: all.totalCount, published: pub.totalCount, draft: dft.totalCount, archived: arc.totalCount });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handlePublish = async (id: number) => {
    try { await articleApi.publish(id); setActionMsg('เผยแพร่สำเร็จ ✅'); load(); }
    catch (e: unknown) { setActionMsg(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันลบบทความนี้?')) return;
    try { await articleApi.delete(id); setActionMsg('ลบสำเร็จ ✅'); load(); }
    catch (e: unknown) { setActionMsg(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1"
            style={{ fontFamily: "'DM Mono',monospace" }}>Admin Panel</p>
          <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "'Playfair Display',serif" }}>
            ยินดีต้อนรับ, {user?.username}
          </h1>
        </div>
        <Link to="/create"
          className="bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition-colors text-sm">
          + เขียนข่าวใหม่
        </Link>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
          {actionMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'บทความทั้งหมด', value: stats.total,     icon: '📰', cls: 'bg-sky-50 border-sky-200 text-sky-700' },
          { label: 'เผยแพร่แล้ว',  value: stats.published, icon: '✅', cls: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'รอการอนุมัติ', value: stats.draft,     icon: '⏳', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'เก็บถาวร',     value: stats.archived,  icon: '📦', cls: 'bg-slate-50 border-slate-200 text-slate-600' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-5 ${s.cls}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-sm font-medium opacity-80 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {['', 'Published', 'Draft', 'Archived'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === s ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {s || 'ทั้งหมด'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">กำลังโหลด...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-slate-400">ไม่พบบทความ</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['หัวข้อ', 'หมวดหมู่', 'ผู้เขียน', 'สถานะ', 'วันที่', 'จัดการ'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map((a, i) => (
                <tr key={a.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                  <td className="px-4 py-3 max-w-xs">
                    <Link to={`/articles/${a.slug}`}
                      className="font-semibold text-slate-800 hover:text-amber-700 line-clamp-1 transition-colors block">
                      {a.title}
                    </Link>
                    {a.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {a.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.categoryName}</td>
                  <td className="px-4 py-3 text-slate-500">{a.authorUsername}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[a.status] ?? ''}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs" style={{ fontFamily: "'DM Mono',monospace" }}>
                    {formatDate(a.publishedAt ?? a.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {a.status === 'Draft' && (
                        <button onClick={() => handlePublish(a.id)}
                          className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors font-semibold">
                          เผยแพร่
                        </button>
                      )}
                      <button onClick={() => handleDelete(a.id)}
                        className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors">
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium ${page === p ? 'bg-slate-900 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>
              {p}
            </button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">→</button>
        </div>
      )}
    </div>
  );
}
