import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Navbar } from './components/common/Navbar';
import { HomePage } from './pages/HomePage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CreateArticlePage } from './pages/CreateArticlePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UnauthorizedPage, NotFoundPage } from './pages/ErrorPages';
import { MyArticlesPage } from './pages/MyArticlesPage';

// Guard: ต้อง Login ก่อน
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Guard: ต้องเป็น Admin
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function Layout({ children, fullscreen = false }: { children: React.ReactNode; fullscreen?: boolean }) {
  const { user, logout } = useAuthStore();
  if (fullscreen) return <>{children}</>;
  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={logout} />
      <main>{children}</main>
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

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <Layout fullscreen={isAdmin}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected: ต้อง Login */}
        <Route path="/create" element={
          <RequireAuth><CreateArticlePage /></RequireAuth>
        } />

        {/* Protected: Editor + Admin */}
        <Route path="/my-articles" element={
          <RequireAuth><MyArticlesPage /></RequireAuth>
        } />

        {/* Protected: Admin only */}
        <Route path="/admin" element={
          <RequireAdmin><AdminDashboard /></RequireAdmin>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
