import { useState } from 'react';
import type { PageName } from '../types';

interface LoginProps {
  onSuccess: () => void;
  onNavigate: (p: PageName) => void;
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

interface RegisterProps {
  onSuccess: () => void;
  onNavigate: (p: PageName) => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

// ── Login ─────────────────────────────────────────────────────────────────────
export function LoginPage({ onSuccess, onNavigate, login, isLoading }: LoginProps) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="กลับมาอ่านข่าวที่คุณชอบ">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800"
        style={{ fontFamily: "'DM Mono',monospace" }}>
        <p className="font-bold mb-1">ⓘ ต้องรัน .NET API ก่อน</p>
        <p>POST /api/auth/login</p>
        <p>POST /api/auth/register</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {error && <ErrorBox>{error}</ErrorBox>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="อีเมล">
            <input type="email" value={email} required placeholder="your@email.com"
              onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="รหัสผ่าน">
            <input type="password" value={password} required placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </Field>
          <SubmitBtn loading={isLoading} label="เข้าสู่ระบบ" />
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          ยังไม่มีบัญชี?{' '}
          <button onClick={() => onNavigate('register')} className="text-amber-600 font-semibold hover:underline">
            สมัครสมาชิก
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
export function RegisterPage({ onSuccess, onNavigate, register, isLoading }: RegisterProps) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('รหัสผ่านไม่ตรงกัน'); return; }
    if (form.password.length < 8)       { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    try {
      await register(form.username, form.email, form.password);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  return (
    <AuthShell title="สมัครสมาชิก" subtitle="เริ่มต้นติดตามข่าวที่คุณสนใจ">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {error && <ErrorBox>{error}</ErrorBox>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="ชื่อผู้ใช้"><input type="text"     value={form.username} required placeholder="username"        onChange={set('username')} className={inputCls} /></Field>
          <Field label="อีเมล">      <input type="email"    value={form.email}    required placeholder="your@email.com" onChange={set('email')}    className={inputCls} /></Field>
          <Field label="รหัสผ่าน">   <input type="password" value={form.password} required placeholder="อย่างน้อย 8 ตัว"  onChange={set('password')} className={inputCls} /></Field>
          <Field label="ยืนยันรหัส"> <input type="password" value={form.confirm}  required placeholder="••••••••"        onChange={set('confirm')}  className={inputCls} /></Field>
          <SubmitBtn loading={isLoading} label="สมัครสมาชิก" />
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          มีบัญชีแล้ว?{' '}
          <button onClick={() => onNavigate('login')} className="text-amber-600 font-semibold hover:underline">
            เข้าสู่ระบบ
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all';

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "'Playfair Display',serif" }}>{title}</h1>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>
        {children}
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

function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">{children}</div>;
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors">
      {loading ? 'กำลังดำเนินการ...' : label}
    </button>
  );
}
