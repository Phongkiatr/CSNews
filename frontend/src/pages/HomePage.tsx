import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { ArticleListItem, Category } from '../types';
import { articleApi, categoryApi } from '../api';
import { ArticleCard } from '../components/article/ArticleCard';
import { getImageUrl } from '../utils/format';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  const [trending, setTrending] = useState<ArticleListItem[]>([]);
  const [trendingIdx, setTrendingIdx] = useState(0);

  useEffect(() => {
    articleApi.getTrending(3).then(setTrending).catch(console.error);
  }, []);

  useEffect(() => {
    if (trending.length < 2) return;
    const timer = setInterval(() => setTrendingIdx(p => (p + 1) % trending.length), 5000);
    return () => clearInterval(timer);
  }, [trending.length]);

  // Read filter state from URL query params
  const page = Number(searchParams.get('page') ?? 1);
  const search = searchParams.get('search') ?? '';
  const categoryName = searchParams.get('category') ?? '';

  useEffect(() => { categoryApi.getAll().then(setCategories).catch(console.error); }, []);

  // Resolve category name to ID
  const selectedCat = categories.find(c => c.name === categoryName)?.id;

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
    } finally { setLoading(false); }
  }, [page, selectedCat, search]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { setSearchInput(search); }, [search]);

  const handleCatChange = (name?: string) => {
    const p: Record<string, string> = {};
    if (name) p.category = name;
    if (search) p.search = search;
    setSearchParams(p);
  };

  const handleSearch = () => {
    const p: Record<string, string> = { search: searchInput };
    if (categoryName) p.category = categoryName;
    setSearchParams(p);
  };

  const setPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) };
    if (search) params.search = search;
    if (categoryName) params.category = categoryName;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featured = articles.filter(a => a.isFeatured);
  const rest = articles.filter(a => !a.isFeatured);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {/* Hero banner */}
      <div className="bg-slate-950 text-white px-6 py-10 lg:py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight"
              style={{ fontFamily: "'Playfair Display',serif" }}>
              ข่าวสารทันโลก<br />
              <span className="text-amber-400">อัปเดตทุกวัน</span>
            </h1>
            <p className="text-slate-400 text-base mb-8 max-w-md leading-relaxed">รวมข่าวที่คุณต้องรู้ ครอบคลุมทุกมิติ เจาะลึกเหตุการณ์สำคัญ อัปเดตสถานการณ์ตลอด 24 ชั่วโมง</p>
            <div className="flex max-w-md">
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="ค้นหาข่าว..."
                className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-l-xl text-sm focus:outline-none focus:border-amber-500 transition-colors" />
              <button onClick={handleSearch}
                className="bg-amber-500 text-slate-950 px-6 py-3 rounded-r-xl font-bold text-sm hover:bg-amber-400 transition-colors flex items-center gap-2">
                <span className="la las la-search text-lg"></span> ค้นหา
              </button>
            </div>
          </div>

          {/* Trending Slider */}
          {trending.length > 0 && (
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-video bg-slate-900 group shadow-2xl shadow-amber-500/10">
              <img 
                src={getImageUrl(trending[trendingIdx].thumbnailUrl)} 
                alt={trending[trendingIdx].title}
                className="w-full h-full object-cover transition-transform duration-700 scale-105 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
              
              <div className="absolute top-4 right-4 flex gap-1 z-10">
                {trending.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setTrendingIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === trendingIdx ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="la las la-fire"></span> ฮิตสุดอันดับ {trendingIdx + 1}
                  </span>
                  <span className="text-white/80 text-xs px-2 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                    {trending[trendingIdx].categoryName}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 line-clamp-2 leading-snug" style={{ fontFamily: "'Playfair Display',serif" }}>
                  {trending[trendingIdx].title}
                </h2>
                <Link to={`/articles/${trending[trendingIdx].slug}`} 
                  className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors group/link">
                  อ่านข่าวนี้ <span className="la las la-arrow-right transform group-hover/link:translate-x-1 transition-transform"></span>
                </Link>
              </div>

              <button 
                onClick={() => setTrendingIdx(p => (p - 1 + trending.length) % trending.length)} 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-110 backdrop-blur-sm z-10">
                <span className="la las la-angle-left text-xl"></span>
              </button>
              <button 
                onClick={() => setTrendingIdx(p => (p + 1) % trending.length)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-110 backdrop-blur-sm z-10">
                <span className="la las la-angle-right text-xl"></span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Category filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6 border-b border-slate-200 pb-4">
          <button onClick={() => handleCatChange(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${!categoryName ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20' : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50'}`}>
            ทั้งหมด
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => handleCatChange(c.name)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${categoryName === c.name ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20' : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50'}`}>
              {c.name}
              <span className="ml-1 text-xs opacity-70">({c.articleCount})</span>
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-slate-400 mb-4" style={{ fontFamily: "'DM Mono',monospace" }}>
            พบ {totalCount.toLocaleString()} ข่าว{search && ` · ค้นหา "${search}"`}
          </p>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="la las la-exclamation-triangle text-lg"></span>
              {error}
            </span>
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

        {/* Featured articles */}
        {!loading && featured.length > 0 && (
          <section className="mb-10">
            <SectionLabel accent>ข่าวแนะนำ</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((a, i) => (
                <div key={a.id} className={i === 0 ? 'md:col-span-2' : ''}>
                  <ArticleCard article={a} variant={i === 0 ? 'hero' : 'featured'} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest articles */}
        {!loading && rest.length > 0 && (
          <section>
            <SectionLabel>ข่าวล่าสุด</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-20 text-slate-400">
            <p className="mb-3 text-slate-200">
              <span className="la las la-search text-6xl"></span>
            </p>
            <p className="text-lg font-medium">ไม่พบข่าวที่ค้นหา</p>
            {search && (
              <button onClick={() => { setSearchInput(''); setSearchParams({}); }}
                className="mt-2 text-sm text-amber-600 hover:underline">
                ล้างการค้นหา
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex gap-2 justify-center mt-10">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors">
              ← ก่อนหน้า
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-slate-900 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
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
