import { useState, useEffect } from 'react';
import type { User, Category, PageName } from '../types';
import { articleApi, categoryApi, uploadApi } from '../api';
import { getImageUrl } from '../utils/format';

interface Props {
  user: User;
  editSlug?: string;
  onNavigate: (p: PageName, slug?: string) => void;
}

interface FormState {
  title: string;
  summary: string;
  content: string;
  categoryId: number;
  tags: string;
  isFeatured: boolean;
  status: 'Draft' | 'Published' | 'Archived';
}

const EMPTY: FormState = {
  title: '', summary: '', content: '',
  categoryId: 0, tags: '', isFeatured: false, status: 'Draft',
};

export function CreateArticlePage({ user, onNavigate }: Props) {
  const [form,        setForm]        = useState<FormState>(EMPTY);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [thumbFile,   setThumbFile]   = useState<File | null>(null);
  const [thumbPreview,setThumbPreview]= useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [savedSlug,   setSavedSlug]   = useState('');

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((p) => ({ ...p, [name]: val }));
  };

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAttachments((p) => [...p, ...Array.from(e.target.files ?? [])]);

  const removeAttachment = (i: number) =>
    setAttachments((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    if (!form.categoryId) { setError('กรุณาเลือกหมวดหมู่'); return; }
    setSaving(true);
    setError('');

    try {
      // 1. Create article
      const article = await articleApi.create({
        title: form.title,
        summary: form.summary,
        content: form.content,
        categoryId: Number(form.categoryId),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
      });

      // 2. Upload thumbnail if chosen
      if (thumbFile) {
        const uploaded = await uploadApi.uploadImage(thumbFile);
        // Update article with thumbnail URL
        await articleApi.update(article.id, {
          ...form,
          categoryId: Number(form.categoryId),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          status: 'Draft',
          thumbnailUrl: uploaded.filePath,
        } as never);
      }

      // 3. Upload file attachments
      for (const file of attachments) {
        await uploadApi.uploadArticleFile(file, article.id);
      }

      // 4. Publish if requested
      if (publish) await articleApi.publish(article.id);

      setSavedSlug(article.slug);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (savedSlug) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center" style={{ fontFamily: "'DM Sans',sans-serif" }}>
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
          บันทึกสำเร็จ!
        </h2>
        <p className="text-slate-500 mb-6">บทความถูกบันทึกแล้ว</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => onNavigate('detail', savedSlug)}
            className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-amber-400 transition-colors">
            ดูบทความ
          </button>
          <button onClick={() => { setSavedSlug(''); setForm(EMPTY); setThumbPreview(''); setAttachments([]); }}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            เขียนใหม่
          </button>
          <button onClick={() => onNavigate('home')}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
            หน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "'Playfair Display',serif" }}>
            ✍️ เขียนข่าวใหม่
          </h1>
          <p className="text-slate-500 text-sm mt-1">เขียนโดย <strong>{user.username}</strong> · ส่งไป POST /api/articles</p>
        </div>
        <button onClick={() => onNavigate('home')} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← ยกเลิก
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        {/* Title */}
        <Field label="หัวข้อข่าว *">
          <input name="title" value={form.title} onChange={handleChange} required
            placeholder="หัวข้อข่าวที่โดนใจ..."
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-semibold" />
        </Field>

        {/* Summary */}
        <Field label="สรุปข่าว *">
          <textarea name="summary" value={form.summary} onChange={handleChange} required rows={3}
            placeholder="อธิบายสั้นๆ..."
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none" />
        </Field>

        {/* Category + Tags */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="หมวดหมู่ *">
            <select name="categoryId" value={form.categoryId} onChange={handleChange} required
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white transition-all">
              <option value={0}>-- เลือก --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="แท็ก (คั่นด้วยคอมมา)">
            <input name="tags" value={form.tags} onChange={handleChange}
              placeholder="เช่น AI, เทคโนโลยี"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all" />
          </Field>
        </div>

        {/* Content */}
        <Field label="เนื้อหา *">
          <textarea name="content" value={form.content} onChange={handleChange} required rows={12}
            placeholder="เนื้อหาข่าว (รองรับ HTML)"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none font-mono" />
        </Field>

        {/* Thumbnail */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6">
          <p className="text-sm font-semibold text-slate-700 mb-3">รูปหน้าปก</p>
          <input type="file" accept="image/*" onChange={handleThumb} className="hidden" id="thumb" />
          {thumbPreview ? (
            <div className="relative">
              <img src={thumbPreview} alt="preview" className="w-full h-48 object-cover rounded-lg" />
              <button type="button" onClick={() => { setThumbFile(null); setThumbPreview(''); }}
                className="absolute top-2 right-2 bg-slate-900/70 text-white text-xs px-3 py-1 rounded-lg hover:bg-slate-900 transition-colors">
                เปลี่ยน
              </button>
            </div>
          ) : (
            <label htmlFor="thumb" className="flex flex-col items-center justify-center h-32 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
              <span className="text-3xl mb-2">🖼️</span>
              <span className="text-sm font-medium">คลิกเพื่ออัปโหลด → POST /api/upload/image</span>
              <span className="text-xs mt-1">PNG, JPG, WEBP (max 10MB)</span>
            </label>
          )}
        </div>

        {/* Attachments */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">ไฟล์แนบ</p>
          <input type="file" multiple accept=".pdf,.doc,.docx,image/*"
            onChange={handleFiles} className="hidden" id="attachments" />
          <label htmlFor="attachments"
            className="flex items-center gap-2 text-sm text-amber-600 font-semibold cursor-pointer hover:text-amber-700 transition-colors w-fit">
            <span>📎</span> เพิ่มไฟล์ → POST /api/upload/article/:id
          </label>
          {attachments.length > 0 && (
            <ul className="mt-3 space-y-1">
              {attachments.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span>📄</span>
                  <span className="flex-1">{f.name}</span>
                  <span className="text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
                  <button type="button" onClick={() => removeAttachment(i)}
                    className="text-red-400 hover:text-red-600 ml-1">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Featured toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-11 h-6 rounded-full transition-colors ${form.isFeatured ? 'bg-amber-500' : 'bg-slate-200'}`}>
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="sr-only" />
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isFeatured ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm font-medium text-slate-700">⭐ ปักหมุดเป็นข่าวแนะนำ</span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button type="submit" disabled={saving}
            className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors">
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกร่าง'}
          </button>
          {['Editor', 'Admin'].includes(user.role) && (
            <button type="button" disabled={saving}
              onClick={(e) => handleSubmit(e as React.FormEvent, true)}
              className="px-6 bg-amber-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-60 transition-colors">
              🚀 เผยแพร่
            </button>
          )}
        </div>
      </form>
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
