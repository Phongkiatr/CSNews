import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="ยินดีต้อนรับกลับ">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox msg={error} />}
        <Field label="อีเมล">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="your@email.com" className={inputCls} />
        </Field>
        <Field label="รหัสผ่าน">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="••••••••" className={inputCls} />
        </Field>
        <button type="submit" disabled={isLoading} className={btnCls}>
          {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
        <p className="text-center text-sm text-slate-500">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-amber-600 font-semibold hover:underline">สมัครสมาชิก</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  return (
    <AuthShell title="สมัครสมาชิก" subtitle="สร้างบัญชีใหม่">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox msg={error} />}
        <Field label="ชื่อผู้ใช้">
          <input value={username} onChange={e => setUsername(e.target.value)}
            required placeholder="username" className={inputCls} />
        </Field>
        <Field label="อีเมล">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="your@email.com" className={inputCls} />
        </Field>
        <Field label="รหัสผ่าน">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="อย่างน้อย 6 ตัวอักษร" minLength={6} className={inputCls} />
        </Field>
        <button type="submit" disabled={isLoading} className={btnCls}>
          {isLoading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
        <p className="text-center text-sm text-slate-500">
          มีบัญชีแล้ว?{' '}
          <Link to="/login" className="text-amber-600 font-semibold hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </form>
    </AuthShell>
  );
}

// --- Shared UI components ---
const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all";
const btnCls = "w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors";

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black text-slate-900 hover:text-amber-600 transition-colors"
            style={{ fontFamily: "'Playfair Display',serif" }}>
            CSNews
          </Link>
          <h1 className="text-xl font-bold text-slate-900 mt-4">{title}</h1>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <span className="la las la-exclamation-triangle"></span> {msg}
    </div>
  );
}
