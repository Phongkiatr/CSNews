import { useState, useEffect, useCallback } from 'react';
import type { ArticleListItem, Category, PageName } from '../types';
import { articleApi, categoryApi } from '../api';
import { ArticleCard } from '../components/article/ArticleCard';

interface Props {
  onNavigate: (p: PageName, slug?: string) => void;
}

export function HomePage({ onNavigate }: Props) {
  const [articles,    setArticles]    = useState<ArticleListItem[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | undefined>();
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // Load categories once
  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(console.error);
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await articleApi.getAll({
        page, pageSize: 9,
        categoryId: selectedCat,
        search: search || undefined,
      });
      setArticles(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'โหลดข่าวไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [page, selectedCat, search]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // Reset page when filter changes
  const handleCatChange = (id?: number) => { setSelectedCat(id); setPage(1); };
  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const featured = articles.filter((a) => a.isFeatured);
  const rest      = articles.filter((a) => !a.isFeatured);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {/* Hero banner */}
      <div className="bg-slate-950 text-white px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight"
            style={{ fontFamily: "'Playfair Display',serif" }}>
            ข่าวสารทันโลก<br />
            <span className="text-amber-400">อัปเดตทุกวัน</span>
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            รวมข่าวที่คุณต้องรู้ ครอบคลุมทุกมิติ — powered by CSNews API
          </p>
          <div className="flex max-w-md">
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ค้นหาข่าว..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-4 py-2.5 rounded-l-lg text-sm focus:outline-none focus:border-amber-500 transition-colors" />
            <button onClick={handleSearch}
              className="bg-amber-500 text-slate-950 px-5 py-2.5 rounded-r-lg font-bold text-sm hover:bg-amber-400 transition-colors">
              ค้นหา
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6 border-b border-slate-200 pb-4">
          <button onClick={() => handleCatChange(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              !selectedCat ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
            ทั้งหมด
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => handleCatChange(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCat === c.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
              {c.name}
              <span className="ml-1 text-xs opacity-50">({c.articleCount})</span>
            </button>
          ))}
        </div>

        {/* Status bar */}
        {!loading && (
          <p className="text-xs text-slate-400 mb-4" style={{ fontFamily: "'DM Mono',monospace" }}>
            พบ {totalCount.toLocaleString()} ข่าว
            {search && ` · ค้นหา "${search}"`}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={fetchArticles} className="text-xs font-semibold underline">ลองใหม่</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured */}
        {!loading && featured.length > 0 && (
          <section className="mb-10">
            <SectionLabel accent>ข่าวแนะนำ</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((a, i) => (
                <div key={a.id} className={i === 0 ? 'md:col-span-2' : ''}>
                  <ArticleCard article={a} variant={i === 0 ? 'hero' : 'featured'} onNavigate={onNavigate} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rest */}
        {!loading && rest.length > 0 && (
          <section>
            <SectionLabel>ข่าวล่าสุด</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((a) => (
                <ArticleCard key={a.id} article={a} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg font-medium">ไม่พบข่าวที่ค้นหา</p>
            {search && <button onClick={() => { setSearch(''); setSearchInput(''); }} className="mt-2 text-sm text-amber-600 hover:underline">ล้างการค้นหา</button>}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex gap-2 justify-center mt-10">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors">
              ← ก่อนหน้า
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === p ? 'bg-slate-900 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors">
              ถัดไป →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children, accent }: { children: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className={`w-1 h-5 rounded-full ${accent ? 'bg-amber-500' : 'bg-slate-300'}`} />
      <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase"
        style={{ fontFamily: "'DM Mono',monospace" }}>
        {children}
      </h2>
    </div>
  );
}
