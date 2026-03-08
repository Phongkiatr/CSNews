import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { ArticleDetail } from '../types';
import { articleApi } from '../api';
import { formatDate, formatNum, formatSize, getImageUrl } from '../utils/format';
import { useAuthStore } from '../store/useAuthStore';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setError('');
    articleApi.getBySlug(slug)
      .then(data => { setArticle(data); window.scrollTo({ top: 0 }); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageShell><LoadingDetail /></PageShell>;

  if (error) return (
    <PageShell>
      <div className="text-center py-20">
        <p className="text-4xl mb-4">😔</p>
        <p className="text-lg font-semibold text-slate-700 mb-2">{error}</p>
        <Link to="/" className="text-amber-600 hover:underline text-sm">← กลับหน้าแรก</Link>
      </div>
    </PageShell>
  );

  if (!article) return null;

  const canEdit = user && (user.role === 'Admin' || user.id === article.author.id);

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6"
        style={{ fontFamily: "'DM Mono',monospace" }}>
        <Link to="/" className="hover:text-slate-700 transition-colors">หน้าแรก</Link>
        <span>/</span>
        <span className="text-amber-600">{article.categoryName}</span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
          {article.categoryName}
        </span>
        {article.isFeatured && (
          <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-semibold">⭐ แนะนำ</span>
        )}
        {user && article.status !== 'Published' && (
          <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full">
            📝 {article.status}
          </span>
        )}
        {canEdit && (
          <button onClick={() => navigate(`/create?edit=${article.slug}`)}
            className="ml-auto text-xs border border-slate-300 text-slate-500 px-3 py-1 rounded-full hover:border-amber-400 hover:text-amber-600 transition-colors">
            ✏️ แก้ไข
          </button>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4"
        style={{ fontFamily: "'Playfair Display',serif" }}>
        {article.title}
      </h1>
      <p className="text-lg text-slate-500 mb-6 leading-relaxed">{article.summary}</p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-slate-200 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {article.author.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{article.author.username}</p>
            <p className="text-xs">{article.author.role}</p>
          </div>
        </div>
        <span>·</span>
        <span>📅 {formatDate(article.publishedAt ?? article.createdAt)}</span>
        <span>·</span>
        <span>👁 {formatNum(article.viewCount)} ครั้ง</span>
      </div>

      {/* Thumbnail */}
      {article.thumbnailUrl && (
        <div className="my-8 rounded-2xl overflow-hidden shadow-lg">
          <img src={getImageUrl(article.thumbnailUrl)} alt={article.title}
            className="w-full object-cover max-h-96" />
        </div>
      )}

      {/* Content */}
      <div className="prose max-w-none text-slate-700 text-base leading-8"
        dangerouslySetInnerHTML={{ __html: article.content }} />

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-slate-100">
          {article.tags.map(t => (
            <Link key={t} to={`/?search=${t}`}
              className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full hover:bg-slate-200 cursor-pointer transition-colors">
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* Files */}
      {article.files.length > 0 && (
        <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <h3 className="font-bold text-slate-700 mb-3 text-sm">📎 ไฟล์แนบ ({article.files.length})</h3>
          <div className="space-y-2">
            {article.files.map(f => (
              <a key={f.id} href={getImageUrl(f.filePath)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-slate-700 bg-white px-4 py-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:text-amber-700 transition-all">
                <span>{f.fileType === 'image' ? '🖼️' : '📄'}</span>
                <span className="flex-1">{f.originalFileName}</span>
                <span className="text-xs text-slate-400">{formatSize(f.fileSize)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <Link to="/" className="mt-10 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        ← กลับหน้าแรก
      </Link>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {children}
    </div>
  );
}

function LoadingDetail() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/4" />
      <div className="h-8 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-64 bg-slate-200 rounded-2xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded" />
        ))}
      </div>
    </div>
  );
}
