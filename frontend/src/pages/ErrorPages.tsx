import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-6"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div>
        <p className="mb-4 text-slate-200">
          <span className="la las la-lock text-7xl"></span>
        </p>
        <h1 className="text-2xl font-black text-slate-900 mb-2"
          style={{ fontFamily: "'Playfair Display',serif" }}>
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="text-slate-500 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <Link to="/" className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-6"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div>
        <p className="mb-4 text-slate-200">
          <span className="la las la-exclamation-triangle text-lg"></span>
        </p>
        <h1 className="text-2xl font-black text-slate-900 mb-2"
          style={{ fontFamily: "'Playfair Display',serif" }}>
          ไม่พบหน้าที่ต้องการ
        </h1>
        <p className="text-slate-500 mb-6">หน้านี้อาจถูกลบหรือ URL ไม่ถูกต้อง</p>
        <Link to="/" className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
