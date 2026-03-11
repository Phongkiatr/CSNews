import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const ROLE_BADGE: Record<string, string> = {
  Admin: 'bg-amber-500/20 text-amber-400',
  Editor: 'bg-sky-500/20 text-sky-400',
  Reader: 'bg-slate-700 text-slate-400',
};

export function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    onLogout();
    navigate('/');
  };

  return (
    <header className="bg-slate-950 text-white sticky top-0 z-50 border-b border-slate-800">
      {/* <div className="border-b border-slate-800 px-6 py-1.5 flex justify-between items-center"
        style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: '#94a3b8' }}>
        <span>CS News Platform</span>
        <span className="font-medium tracking-widest" style={{ color: '#f59e0b' }}>CSNews</span>
        <span>Connected to .NET API</span>
      </div> */}

      <div className="px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/"
          className="text-2xl font-black tracking-tight text-white transition-colors"
          style={{ fontFamily: "'Playfair Display',serif" }}>
          <span className="text-amber-400">CS</span>News
        </Link>

        <nav className="hidden md:flex gap-1 flex-1 justify-center" style={{ fontFamily: "'DM Sans',sans-serif" }}>
          <Link to="/" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all">
            ทั้งหมด
          </Link>
          {['เทคโนโลยี', 'การเมือง', 'เศรษฐกิจ', 'กีฬา', 'บันเทิง'].map(c => (
            <Link key={c} to={`/?category=${c}`}
              className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all">
              {c}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3" style={{ fontFamily: "'DM Sans',sans-serif" }}>
          {user ? (
            <>
              {/* Write article button (Editor/Admin only) */}
              {['Editor', 'Admin'].includes(user.role) && (
                <Link to="/create"
                  className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded hover:bg-amber-400 transition-colors">
                  + เขียนข่าว
                </Link>
              )}

              {/* User dropdown */}
              <div className="relative" ref={ref}>
                <button onClick={() => setOpen(p => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-sm text-slate-300">{user.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role] ?? ''}`}>
                      {user.role}
                    </span>
                  </div>
                  <span className={`text-slate-400 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>

                {/* Dropdown menu */}
                {open && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                    {['Editor', 'Admin'].includes(user.role) && (
                      <Link to="/my-articles"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <span className="la las la-edit text-lg"></span> โพสต์ของฉัน
                      </Link>
                    )}
                    {user.role === 'Admin' && (
                      <Link to="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <span className="la las la-cog text-lg"></span> Dashboard
                      </Link>
                    )}
                    <div className="border-t border-slate-700" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors">
                      <span className="la las la-sign-out-alt text-lg"></span> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
                เข้าสู่ระบบ
              </Link>
              <Link to="/register"
                className="text-sm bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-amber-400 transition-colors">
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}