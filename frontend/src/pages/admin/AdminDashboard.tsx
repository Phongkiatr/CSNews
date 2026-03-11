import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { ArticleListItem, User } from '../../types';
import { articleApi, usersApi } from '../../api';
import { formatDate } from '../../utils/format';

// --- Sidebar navigation items ---
const NAV = [
  { icon: 'la-chart-bar', label: 'Dashboard', tab: 'overview' },
  { icon: 'la-newspaper', label: 'บทความ', tab: 'articles' },
  { icon: 'la-users', label: 'ผู้ใช้งาน', tab: 'users' },
];

const ROLE_COLOR: Record<string, string> = {
  Admin: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Editor: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  Reader: 'bg-slate-700/60 text-slate-400 border border-slate-600',
};

const STATUS_COLOR: Record<string, string> = {
  Published: 'bg-emerald-500/15 text-emerald-400',
  Draft: 'bg-amber-500/15 text-amber-400',
  Archived: 'bg-slate-700 text-slate-400',
};

export function AdminDashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0, published: 0, draft: 0,
    totalUsers: 0, adminCount: 0, editorCount: 0
  });
  const [artFilter, setArtFilter] = useState('');
  const [artPage, setArtPage] = useState(1);
  const [artTotal, setArtTotal] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [roleModal, setRoleModal] = useState<User | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Load articles ---
  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await articleApi.getAllAdmin({
        page: artPage, pageSize: 10, status: artFilter || undefined,
      });
      setArticles(res.items);
      setArtTotal(res.totalPages);

      const [all, pub, dft] = await Promise.all([
        articleApi.getAllAdmin({ page: 1, pageSize: 1 }),
        articleApi.getAllAdmin({ page: 1, pageSize: 1, status: 'Published' }),
        articleApi.getAllAdmin({ page: 1, pageSize: 1, status: 'Draft' }),
      ]);
      setStats(s => ({ ...s, total: all.totalCount, published: pub.totalCount, draft: dft.totalCount }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [artPage, artFilter]);

  // --- Load users ---
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page: userPage, pageSize: 12 });
      setUsers(res.items);
      setUserTotal(res.totalPages);
      setStats(s => ({
        ...s,
        totalUsers: res.totalCount,
        adminCount: res.adminCount,
        editorCount: res.editorCount
      }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userPage]);

  useEffect(() => { loadArticles(); }, [loadArticles]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  // --- Article actions ---
  const handlePublish = async (id: number) => {
    try { await articleApi.publish(id); notify('เผยแพร่สำเร็จ ✓'); loadArticles(); }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'Error', false); }
  };

  const handleArchiveArticle = async (id: number) => {
    if (!confirm('จัดเก็บบทความนี้?')) return;
    try { await articleApi.archive(id); notify('จัดเก็บสำเร็จ ✓'); loadArticles(); }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'Error', false); }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('ลบบทความนี้?')) return;
    try { await articleApi.delete(id); notify('ลบสำเร็จ ✓'); loadArticles(); }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'Error', false); }
  };

  // --- User actions ---
  const handleChangeRole = async (userId: number, role: string) => {
    try {
      await usersApi.changeRole(userId, role);
      notify(`เปลี่ยน Role เป็น ${role} สำเร็จ ✓`);
      setRoleModal(null);
      loadUsers();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Error', false); }
  };

  const handleSuspend = async (u: User) => {
    try {
      await usersApi.toggleSuspend(u.id);
      notify(u.isActive ? 'ระงับ Account สำเร็จ ✓' : 'คืนสิทธิ์สำเร็จ ✓');
      loadUsers();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Error', false); }
  };

  const handleImpersonate = async (u: User) => {
    if (!confirm(`เข้าสู่ระบบเป็น "${u.username}"?`)) return;
    try {
      const res = await usersApi.impersonate(u.id);
      localStorage.setItem('csnews_token', res.token);
      localStorage.setItem('csnews_user', JSON.stringify(res.user));
      window.location.href = '/';
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Error', false); }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`ลบ "${u.username}" ออกจากระบบ?`)) return;
    try { await usersApi.delete(u.id); notify('ลบผู้ใช้สำเร็จ ✓'); loadUsers(); }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'Error', false); }
  };

  // --- Render ---
  return (
    <div className="flex min-h-screen bg-slate-950" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-950 text-xs font-black">CS</span>
            </div>
            <span className="text-white font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              CSNews
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-bold tracking-widest text-slate-600 px-3 pt-2 pb-1 uppercase">เมนู</p>
          {NAV.map(n => (
            <button key={n.tab} onClick={() => setTab(n.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${tab === n.tab
                ? 'bg-amber-500/10 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
              <span className={`las ${n.icon} text-xl`}></span>
              <span>{n.label}</span>
              {tab === n.tab && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </button>
          ))}

          <p className="text-xs font-bold tracking-widest text-slate-600 px-3 pt-5 pb-1 uppercase">ลิงก์ด่วน</p>
          <Link to="/create"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <span className="las la-edit text-lg"></span><span>เขียนข่าวใหม่</span>
          </Link>
          <Link to="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <span className="las la-globe text-lg"></span><span>ดูหน้าเว็บ</span>
          </Link>
        </nav>

        {/* Logged-in user card */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm flex-shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.username}</p>
              <p className="text-amber-400 text-xs">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-white font-bold text-base">
              {tab === 'overview' && 'Dashboard Overview'}
              {tab === 'articles' && 'จัดการบทความ'}
              {tab === 'users' && 'จัดการผู้ใช้งาน'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/create"
              className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors">
              + เขียนข่าว
            </Link>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 p-6 overflow-auto">

          {/* Toast notification */}
          {toast && (
            <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border transition-all ${toast.ok
              ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-900 border-red-500/40 text-red-400'
              }`}>
              {toast.msg}
            </div>
          )}

          {/* ══ OVERVIEW TAB ══ */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'บทความทั้งหมด', value: stats.total, icon: 'la-newspaper', delta: 'Articles', color: 'from-sky-500/20 to-sky-600/5', border: 'border-sky-500/20', text: 'text-sky-400' },
                  { label: 'เผยแพร่แล้ว', value: stats.published, icon: 'la-check-circle', delta: 'Published', color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                  { label: 'ฉบับร่าง', value: stats.draft, icon: 'la-edit', delta: 'Draft', color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/20', text: 'text-amber-400' },
                  { label: 'ผู้ใช้งาน', value: stats.totalUsers, icon: 'la-users', delta: 'Users', color: 'from-violet-500/20 to-violet-600/5', border: 'border-violet-500/20', text: 'text-violet-400' },
                ].map(s => (
                  <div key={s.label}
                    className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center`}>
                        <span className={`la las ${s.icon} text-2xl ${s.text}`}></span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${s.text}`}>{s.delta}</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-0.5">{s.value}</div>
                    <div className="text-slate-400 text-sm">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent articles */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-white font-bold">บทความล่าสุด</h2>
                  <button onClick={() => setTab('articles')}
                    className="text-xs text-slate-400 hover:text-amber-400 transition-colors">
                    ดูทั้งหมด →
                  </button>
                </div>
                {loading ? <LoadingSkeleton /> : (
                  <div className="divide-y divide-slate-800">
                    {articles.slice(0, 5).map(a => (
                      <div key={a.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-800/40 transition-colors">
                        <div className="flex-1 min-w-0">
                          <Link to={`/articles/${a.slug}`}
                            className="text-sm font-medium text-slate-200 hover:text-amber-400 transition-colors line-clamp-1">
                            {a.title}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">{a.authorUsername} · {formatDate(a.createdAt)}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[a.status] ?? ''}`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent users */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-white font-bold">ผู้ใช้งานล่าสุด</h2>
                  <button onClick={() => setTab('users')}
                    className="text-xs text-slate-400 hover:text-amber-400 transition-colors">
                    จัดการ →
                  </button>
                </div>
                <div className="divide-y divide-slate-800">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 font-medium">{u.username}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.role] ?? ''}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ARTICLES TAB ══ */}
          {tab === 'articles' && (
            <div className="space-y-5">
              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'ทั้งหมด', value: stats.total, color: 'text-white' },
                  { label: 'เผยแพร่แล้ว', value: stats.published, color: 'text-emerald-400' },
                  { label: 'ฉบับร่าง', value: stats.draft, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter + Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-2">
                    {['', 'Published', 'Draft', 'Archived'].map(s => (
                      <button key={s} onClick={() => { setArtFilter(s); setArtPage(1); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${artFilter === s
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}>
                        {s || 'ทั้งหมด'}
                      </button>
                    ))}
                  </div>
                  <Link to="/create"
                    className="text-xs bg-slate-800 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                    + เพิ่มบทความ
                  </Link>
                </div>

                {loading ? <LoadingSkeleton /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          {['หัวข้อ', 'หมวด', 'ผู้เขียน', 'สถานะ', 'วันที่', ''].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {articles.map(a => (
                          <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3.5 max-w-xs">
                              <Link to={`/articles/${a.slug}`}
                                className="font-medium text-slate-200 hover:text-amber-400 transition-colors line-clamp-1 block">
                                {a.title}
                              </Link>
                              {a.tags.slice(0, 2).map(t => (
                                <span key={t} className="text-xs text-slate-600 mr-1">#{t}</span>
                              ))}
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 text-xs">{a.categoryName}</td>
                            <td className="px-5 py-3.5 text-slate-400 text-xs">{a.authorUsername}</td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[a.status] ?? ''}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">
                              {formatDate(a.publishedAt ?? a.createdAt)}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-1.5">
                                {a.status === 'Draft' && (
                                  <button onClick={() => handlePublish(a.id)}
                                    className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg hover:bg-emerald-500/25 transition-colors font-medium">
                                    เผยแพร่
                                  </button>
                                )}
                                {a.status !== 'Archived' && (
                                  <button onClick={() => handleArchiveArticle(a.id)}
                                    className="text-xs bg-slate-500/15 text-slate-400 border border-slate-500/30 px-2.5 py-1 rounded-lg hover:bg-slate-500/25 transition-colors font-medium">
                                    จัดเก็บ
                                  </button>
                                )}
                                <Link to={`/create?edit=${a.slug}`}
                                  className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg hover:bg-slate-700 transition-colors">
                                  แก้ไข
                                </Link>
                                <button onClick={() => handleDeleteArticle(a.id)}
                                  className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/20 transition-colors">
                                  ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {artTotal > 1 && (
                  <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">หน้า {artPage} / {artTotal}</span>
                    <div className="flex gap-1.5">
                      <button disabled={artPage === 1} onClick={() => setArtPage(p => p - 1)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-700 transition-colors">
                        ←
                      </button>
                      <button disabled={artPage === artTotal} onClick={() => setArtPage(p => p + 1)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-700 transition-colors">
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ USERS TAB ══ */}
          {tab === 'users' && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, color: 'text-white' },
                  { label: 'Admin', value: stats.adminCount, color: 'text-amber-400' },
                  { label: 'Editor', value: stats.editorCount, color: 'text-sky-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Users table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <h2 className="text-white font-bold">รายชื่อผู้ใช้งาน</h2>
                </div>

                {loading ? <LoadingSkeleton /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          {['ผู้ใช้', 'อีเมล', 'Role', 'สถานะ', 'การจัดการ'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                            {/* Avatar + name */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                  {u.username[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-200">{u.username}</p>
                                  <p className="text-xs text-slate-500 font-mono">#{u.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">{u.email}</td>

                            {/* Role badge — click to change */}
                            <td className="px-5 py-3.5">
                              <button onClick={() => setRoleModal(u)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all hover:brightness-125 ${ROLE_COLOR[u.role] ?? ''}`}>
                                {u.role} ▾
                              </button>
                            </td>

                            {/* Active status */}
                            <td className="px-5 py-3.5">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive !== false
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                                }`}>
                                {u.isActive !== false ? '● Active' : '● Suspended'}
                              </span>
                            </td>

                            {/* Actions (visible on hover) */}
                            <td className="px-5 py-3.5">
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {u.id !== user?.id && (
                                  <button onClick={() => handleImpersonate(u)}
                                    title="Login as this user"
                                    className="flex items-center gap-1.5 text-xs bg-violet-500/15 text-violet-400 border border-violet-500/30 px-3 py-1.5 rounded-lg hover:bg-violet-500/25 transition-colors font-medium">
                                    <span>⇄</span> Login as
                                  </button>
                                )}
                                {u.id !== user?.id && (
                                  <button onClick={() => handleSuspend(u)}
                                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${u.isActive !== false
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                      }`}>
                                    {u.isActive !== false ? 'ระงับ' : 'คืนสิทธิ์'}
                                  </button>
                                )}
                                {u.id !== user?.id && (
                                  <button onClick={() => handleDeleteUser(u)}
                                    className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                                    ลบ
                                  </button>
                                )}
                                {u.id === user?.id && (
                                  <span className="text-xs text-slate-600 italic px-2">คุณ</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {userTotal > 1 && (
                  <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">หน้า {userPage} / {userTotal}</span>
                    <div className="flex gap-1.5">
                      <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-700">←</button>
                      <button disabled={userPage === userTotal} onClick={() => setUserPage(p => p + 1)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-700">→</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Role change modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setRoleModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-80 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-1">เปลี่ยน Role</h3>
            <p className="text-slate-400 text-sm mb-5">
              ผู้ใช้: <span className="text-white font-semibold">{roleModal.username}</span>
            </p>
            <div className="space-y-2">
              {['Reader', 'Editor', 'Admin'].map(role => (
                <button key={role} onClick={() => handleChangeRole(roleModal.id, role)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border transition-all ${roleModal.role === role
                    ? `${ROLE_COLOR[role]} opacity-100`
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                    }`}>
                  <span>{role}</span>
                  {roleModal.role === role && <span className="text-xs opacity-60">ปัจจุบัน</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setRoleModal(null)}
              className="mt-4 w-full py-2.5 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700 transition-colors">
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
