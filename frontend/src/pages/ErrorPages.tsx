import type { PageName } from '../types';

interface Props { onNavigate: (p: PageName) => void; }

export function UnauthorizedPage({ onNavigate }: Props) {
  return (
    <ErrorShell onNavigate={onNavigate}>
      <p className="text-6xl mb-4">🚫</p>
      <h2 className="text-2xl font-black text-slate-900 mb-2"
        style={{ fontFamily: "'Playfair Display',serif" }}>ไม่มีสิทธิ์เข้าถึง</h2>
      <p className="text-slate-500 mb-6">คุณไม่มีสิทธิ์เพียงพอสำหรับหน้านี้</p>
    </ErrorShell>
  );
}

export function NotFoundPage({ onNavigate }: Props) {
  return (
    <ErrorShell onNavigate={onNavigate}>
      <p className="text-6xl mb-4">🗞️</p>
      <h2 className="text-2xl font-black text-slate-900 mb-2"
        style={{ fontFamily: "'Playfair Display',serif" }}>404 — ไม่พบหน้านี้</h2>
      <p className="text-slate-500 mb-6">หน้าที่คุณค้นหาไม่มีอยู่หรือถูกลบไปแล้ว</p>
    </ErrorShell>
  );
}

function ErrorShell({ children, onNavigate }: { children: React.ReactNode; onNavigate: (p: PageName) => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {children}
      <button onClick={() => onNavigate('home')}
        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
        ← กลับหน้าแรก
      </button>
    </div>
  );
}
