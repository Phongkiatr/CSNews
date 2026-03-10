import { useState, useEffect } from 'react';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStatus({ msg: 'ส่งข้อความสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด', ok: true });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus(null), 5000);
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12">
        
        {/* Left: Contact Info */}
        <div className="lg:w-1/3 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              ติดต่อเรา
            </h1>
            <p className="text-slate-600 leading-relaxed">
              หากคุณมีคำถาม ข้อเสนอแนะ หรือต้องการความช่วยเหลือ โปรดติดต่อเราผ่านทางแบบฟอร์มด้านข้าง หรือช่องทางดังต่อไปนี้
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                <span className="las la-envelope text-xl"></span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">อีเมล</p>
                <p className="text-slate-800 font-medium">contact@csnews.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl flex items-center justify-center">
                <span className="las la-map-marker text-xl"></span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ที่อยู่</p>
                <p className="text-slate-800 font-medium leading-tight">
                  123/45 ถนนนวัตกรรม เขตบางซื่อ<br />กรุงเทพมหานคร 10800
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-3 bg-violet-500/10 text-violet-600 rounded-xl flex items-center justify-center">
                <span className="las la-comments text-xl"></span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">โซเชียลมีเดีย</p>
                <div className="flex gap-3 mt-1">
                  <a href="#" className="text-slate-500 hover:text-amber-500 transition-colors">Facebook</a>
                  <a href="#" className="text-slate-500 hover:text-amber-500 transition-colors">X (Twitter)</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:w-2/3 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          {status && (
            <div className={`mb-8 p-4 rounded-xl text-sm font-medium border ${
              status.ok ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">ชื่อของคุณ</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">อีเมลติดต่อ</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="john@example.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase px-1">หัวข้อ</label>
              <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="สอบถามข้อมูลเบื้องต้น" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase px-1">ข้อความของคุณ</label>
              <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                placeholder="พิมพ์ข้อความที่ต้องการติดต่อ..." />
            </div>

            <button disabled={loading} type="submit"
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อความ'}
            </button>
          </form>

          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        </div>

      </div>
    </div>
  );
}
