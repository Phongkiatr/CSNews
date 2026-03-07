import type { User, PageName } from '../../types';

interface NavbarProps {
  user: User | null;
  onNavigate: (p: PageName) => void;
  onLogout: () => void;
}

const ROLE_BADGE: Record<string, string> = {
  Admin:  'bg-amber-500/20 text-amber-400',
  Editor: 'bg-sky-500/20 text-sky-400',
  Reader: 'bg-slate-700 text-slate-400',
};

export function Navbar({ user, onNavigate, onLogout }: NavbarProps) {
  return (
    <header className="bg-slate-950 text-white sticky top-0 z-50 border-b border-slate-800">
      <div className="border-b border-slate-800 px-6 py-1.5 flex justify-between items-center"
        style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: '#94a3b8' }}>
        <span>CS News Platform</span>
        <span className="font-medium tracking-widest" style={{ color: '#f59e0b' }}>CSNews</span>
        <span>Connected to .NET API</span>
      </div>

      <div className="px-6 h-14 flex items-center justify-between gap-4">
        <button onClick={() => onNavigate('home')}
          className="text-2xl font-black tracking-tight text-white hover:text-amber-400 transition-colors"
          style={{ fontFamily: "'Playfair Display',serif" }}>
          CSNews
        </button>

        <nav className="hidden md:flex gap-1 flex-1 justify-center" style={{ fontFamily: "'DM Sans',sans-serif" }}>
          {['ข่าวล่าสุด', 'เทคโนโลยี', 'การเมือง', 'เศรษฐกิจ', 'กีฬา'].map((c) => (
            <button key={c}
              className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all">
              {c}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3" style={{ fontFamily: "'DM Sans',sans-serif" }}>
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-slate-300">{user.username}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role] ?? ''}`}>
                  {user.role}
                </span>
              </div>
              {['Editor', 'Admin'].includes(user.role) && (
                <button onClick={() => onNavigate('create')}
                  className="hidden sm:block text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded hover:bg-amber-400 transition-colors">
                  + เขียนข่าว
                </button>
              )}
              {user.role === 'Admin' && (
                <button onClick={() => onNavigate('admin')}
                  className="hidden sm:block text-xs border border-slate-600 text-slate-300 px-3 py-1.5 rounded hover:border-slate-400 transition-colors">
                  Admin
                </button>
              )}
              <button onClick={onLogout} className="text-xs text-slate-400 hover:text-red-400 transition-colors">
                ออก
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onNavigate('login')} className="text-sm text-slate-300 hover:text-white transition-colors">
                เข้าสู่ระบบ
              </button>
              <button onClick={() => onNavigate('register')}
                className="text-sm bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-amber-400 transition-colors">
                สมัครสมาชิก
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
