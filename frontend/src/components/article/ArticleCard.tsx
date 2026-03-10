import { useNavigate } from 'react-router-dom';
import type { ArticleListItem } from '../../types';
import { formatDate, formatNum, getImageUrl } from '../../utils/format';

interface Props {
  article: ArticleListItem;
  variant?: 'hero' | 'featured' | 'default';
}

export function ArticleCard({ article, variant = 'default' }: Props) {
  const navigate = useNavigate();
  const go = () => navigate(`/articles/${article.slug}`);

  if (variant === 'hero' || variant === 'featured') {
    const isHero = variant === 'hero';
    return (
      <button onClick={go}
        className="group text-left rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all w-full">
        <div className={`relative overflow-hidden ${isHero ? 'h-72 md:h-96' : 'h-52'}`}>
          {article.thumbnailUrl ? (
            <img src={getImageUrl(article.thumbnailUrl)} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="la las la-newspaper text-5xl opacity-20 text-white"></span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full mb-3 inline-block">
              {article.categoryName}
            </span>
            <h3 style={{ fontFamily: "'Playfair Display',serif" }}
              className={`text-white font-bold leading-snug ${isHero ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
              {article.title}
            </h3>
            <p className="text-slate-300 text-sm mt-2 line-clamp-2">{article.summary}</p>
            <div className="flex gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="la las la-user-edit"></span> {article.authorUsername}</span>
              <span className="flex items-center gap-1"><span className="la las la-eye"></span> {formatNum(article.viewCount)}</span>
              {article.publishedAt && <span className="flex items-center gap-1"><span className="la las la-calendar"></span> {formatDate(article.publishedAt)}</span>}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button onClick={go}
      className="group text-left rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all bg-white w-full">
      <div className="h-44 overflow-hidden bg-slate-100">
        {article.thumbnailUrl ? (
          <img src={getImageUrl(article.thumbnailUrl)} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="la las la-newspaper text-4xl opacity-20"></span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {article.categoryName}
          </span>
          {article.status !== 'Published' && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {article.status}
            </span>
          )}
        </div>
        <h3 style={{ fontFamily: "'Playfair Display',serif" }}
          className="font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
          {article.title}
        </h3>
        <p className="text-slate-500 text-sm mt-1.5 line-clamp-2">{article.summary}</p>
        <div className="flex gap-3 mt-3 text-xs text-slate-400">
          <span>{article.authorUsername}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><span className="la las la-eye"></span> {formatNum(article.viewCount)}</span>
        </div>
      </div>
    </button>
  );
}
