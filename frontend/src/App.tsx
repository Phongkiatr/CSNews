import { useState, useEffect } from 'react';
import type { PageName } from './types';
import { useAuthStore } from './store/useAuthStore';
import { Navbar } from './components/common/Navbar';
import { HomePage } from './pages/HomePage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CreateArticlePage } from './pages/CreateArticlePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UnauthorizedPage, NotFoundPage } from './pages/ErrorPages';

// ── Inject Google Fonts ───────────────────────────────────────────────────────
(function injectFonts() {
  if (document.getElementById('csnews-fonts')) return;
  const link = document.createElement('link');
  link.id = 'csnews-fonts';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
})();

export default function App() {
  const auth = useAuthStore();
  const { user, login, register, logout, isLoading } = auth;

  const [page,        setPage]        = useState<PageName>('home');
  const [currentSlug, setCurrentSlug] = useState<string>('');

  // Scroll to top on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

  // ── Navigation with guards ────────────────────────────────────────────────
  const navigate = (target: PageName, slug?: string): void => {
    if (target === 'create' && !user)           { setPage('login'); return; }
    if (target === 'admin'  && !user)           { setPage('login'); return; }
    if (target === 'admin'  && user?.role !== 'Admin') { setPage('unauthorized'); return; }
    if (slug) setCurrentSlug(slug);
    setPage(target);
  };

  const handleAuthSuccess = () => setPage('home');
  const handleLogout = () => { logout(); setPage('home'); };

  // ── Route renderer ────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigate} />;

      case 'detail':
        return currentSlug
          ? <ArticleDetailPage slug={currentSlug} user={user} onNavigate={navigate} />
          : <NotFoundPage onNavigate={navigate} />;

      case 'login':
        return <LoginPage onSuccess={handleAuthSuccess} onNavigate={navigate} login={login} isLoading={isLoading} />;

      case 'register':
        return <RegisterPage onSuccess={handleAuthSuccess} onNavigate={navigate} register={register} isLoading={isLoading} />;

      case 'create':
        return user
          ? <CreateArticlePage user={user} onNavigate={navigate} />
          : <UnauthorizedPage onNavigate={navigate} />;

      case 'admin':
        return user?.role === 'Admin'
          ? <AdminDashboard user={user} onNavigate={navigate} />
          : <UnauthorizedPage onNavigate={navigate} />;

      case 'unauthorized':
        return <UnauthorizedPage onNavigate={navigate} />;

      default:
        return <NotFoundPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onNavigate={navigate} onLogout={handleLogout} />
      <main>{renderPage()}</main>
      <footer className="bg-slate-950 text-slate-400 py-8 mt-12" style={{ fontFamily: "'DM Sans',sans-serif" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            CSNews
          </span>
          <p className="text-sm text-center">© 2568 CSNews — ข่าวสารทันโลก อัปเดตทุกวัน</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-white transition-colors">ติดต่อเรา</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
