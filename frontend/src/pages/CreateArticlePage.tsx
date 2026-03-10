import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { Category } from '../types';
import { articleApi, categoryApi, uploadApi } from '../api';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const AUTOSAVE_KEY = 'csnews_draft_autosave';

interface FormState {
  title: string; summary: string; content: string;
  categoryId: number; tags: string; isFeatured: boolean;
  status: 'Draft' | 'Published' | 'Archived';
  thumbnailUrl: string;
}

const EMPTY: FormState = {
  title: '', summary: '', content: '', categoryId: 0,
  tags: '', isFeatured: false, status: 'Draft', thumbnailUrl: '',
};

export function CreateArticlePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editSlug = searchParams.get('edit'); // ?edit=slug = โหมดแก้ไข
  const { user } = useAuthStore();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSlug, setSavedSlug] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const initialLoadDone = useRef(false);

  // โหลด categories
  useEffect(() => { categoryApi.getAll().then(setCategories).catch(console.error); }, []);

  // ถ้าเป็นโหมดแก้ไข — โหลดข้อมูลเดิม | ถ้าโหมดสร้างใหม่ — โหลดจาก Auto-save
  useEffect(() => {
    const loadData = async () => {
      if (editSlug) {
        setLoading(true);
        try {
          const article = await articleApi.getBySlug(editSlug);
          setEditId(article.id);
          setForm({
            title: article.title,
            summary: article.summary,
            content: article.content,
            categoryId: article.categoryId,
            tags: article.tags.join(', '),
            isFeatured: article.isFeatured,
            status: article.status as FormState['status'],
            thumbnailUrl: article.thumbnailUrl ?? '',
          });
          if (article.thumbnailUrl) {
            const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
            setThumbPreview(article.thumbnailUrl.startsWith('http')
              ? article.thumbnailUrl
              : `${base}${article.thumbnailUrl}`);
          }
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
          initialLoadDone.current = true;
        }
      } else {
        // โหมดสร้างใหม่ — ตรวจสอบ Auto-save
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          try {
            setForm(JSON.parse(saved));
            setLastSaved(new Date());
          } catch { /* ignore */ }
        }
        initialLoadDone.current = true;
      }
    };
    loadData();
  }, [editSlug]);

  // Auto-save Logic (เฉพาะโหมดสร้างใหม่)
  useEffect(() => {
    if (editId || !initialLoadDone.current) return;

    const timer = setTimeout(() => {
      if (form.title || form.content) {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [form, editId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(p => ({ ...p, [name]: val }));
  };

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAttachments(p => [...p, ...Array.from(e.target.files ?? [])]);

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    if (!form.categoryId) { setError('กรุณาเลือกหมวดหมู่'); return; }
    setSaving(true); setError('');

    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);

      // อัปโหลดรูปปกใหม่ถ้ามีการเปลี่ยน
      let thumbnailUrl = form.thumbnailUrl || undefined;
      if (thumbFile) {
        const uploaded = await uploadApi.uploadImage(thumbFile);
        thumbnailUrl = uploaded.filePath;
      }

      let slug = '';

      if (editId) {
        // โหมดแก้ไข — update บทความเดิม
        const updated = await articleApi.update(editId, {
          title: form.title,
          summary: form.summary,
          content: form.content,
          categoryId: Number(form.categoryId),
          tags,
          isFeatured: form.isFeatured,
          status: publish ? 'Published' : form.status,
          thumbnailUrl,
        });
        slug = updated.slug;
      } else {
        // โหมดสร้างใหม่
        const article = await articleApi.create({
          title: form.title,
          summary: form.summary,
          content: form.content,
          categoryId: Number(form.categoryId),
          tags,
          isFeatured: form.isFeatured,
        });

        // update thumbnailUrl ถ้ามีรูป
        if (thumbnailUrl) {
          await articleApi.update(article.id, {
            title: form.title,
            summary: form.summary,
            content: form.content,
            categoryId: Number(form.categoryId),
            tags,
            isFeatured: form.isFeatured,
            status: 'Draft',
            thumbnailUrl,
          });
        }

        // แนบไฟล์
        for (const file of attachments)
          await uploadApi.uploadArticleFile(file, article.id);

        // เผยแพร่
        if (publish) await articleApi.publish(article.id);

        slug = article.slug;
        
        // ล้าง Auto-save เมื่อสำเร็จ
        localStorage.removeItem(AUTOSAVE_KEY);
      }

      setSavedSlug(slug);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center text-slate-400 animate-pulse">
      กำลังโหลดบทความ...
    </div>
  );

  if (savedSlug) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-black text-slate-900 mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
        {editId ? 'แก้ไขสำเร็จ!' : 'บันทึกสำเร็จ!'}
      </h2>
      <div className="flex gap-3 justify-center mt-6">
        <button onClick={() => navigate(`/articles/${savedSlug}`)}
          className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-amber-400 transition-colors">
          ดูบทความ
        </button>
        {!editId && (
          <button onClick={() => { setSavedSlug(''); setForm(EMPTY); setThumbPreview(''); setAttachments([]); }}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            เขียนใหม่
          </button>
        )}
        <button onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
          หน้าแรก
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "'Playfair Display',serif" }}>
            {editId ? '✏️ แก้ไขบทความ' : '✍️ เขียนข่าวใหม่'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            โดย <strong>{user?.username}</strong>
            {lastSaved && !editId && <span className="ml-3 text-slate-400 italic text-xs">บันทึกร่างอัตโนมัติแล้วเมื่อ {lastSaved.toLocaleTimeString()}</span>}
          </p>
        </div>
        <Link to={editId ? `/articles/${editSlug}` : '/'} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← ยกเลิก
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={e => handleSubmit(e)} className="space-y-6">
        <Field label="หัวข้อข่าว *">
          <input name="title" value={form.title} onChange={handleChange} required
            placeholder="หัวข้อข่าวที่โดนใจ..." className={inputCls + ' font-semibold'} />
        </Field>

        <Field label="สรุปข่าว *">
          <textarea name="summary" value={form.summary} onChange={handleChange} required rows={3}
            placeholder="อธิบายสั้นๆ..." className={inputCls + ' resize-none'} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="หมวดหมู่ *">
            <select name="categoryId" value={form.categoryId} onChange={handleChange} required
              className={inputCls + ' bg-white'}>
              <option value={0}>-- เลือก --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="แท็ก (คั่นด้วยคอมมา)">
            <input name="tags" value={form.tags} onChange={handleChange}
              placeholder="เช่น AI, เทคโนโลยี" className={inputCls} />
          </Field>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">เนื้อหา *</label>
          <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
            <CKEditor
              editor={ClassicEditor as any}
              data={form.content}
              onChange={(_, editor) => {
                setForm(p => ({ ...p, content: editor.getData() }));
              }}
              config={{
                placeholder: 'เนื้อหาข่าว...',
                toolbar: [
                  'heading', '|',
                  'bold', 'italic', 'underline', '|',
                  'link', 'blockQuote', '|',
                  'bulletedList', 'numberedList', '|',
                  'insertTable', '|',
                  'undo', 'redo'
                ],
              }}
            />
          </div>
        </div>

        {/* Thumbnail */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6">
          <p className="text-sm font-semibold text-slate-700 mb-3">รูปหน้าปก</p>
          <input type="file" accept="image/*" onChange={handleThumb} className="hidden" id="thumb" />
          {thumbPreview ? (
            <div className="relative">
              <img src={thumbPreview} alt="preview" className="w-full h-48 object-cover rounded-lg" />
              <label htmlFor="thumb"
                className="absolute top-2 right-2 bg-slate-900/70 text-white text-xs px-3 py-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer">
                เปลี่ยน
              </label>
            </div>
          ) : (
            <label htmlFor="thumb" className="flex flex-col items-center justify-center h-32 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
              <span className="text-3xl mb-2">🖼️</span>
              <span className="text-sm font-medium">คลิกเพื่ออัปโหลดรูปหน้าปก</span>
              <span className="text-xs mt-1">PNG, JPG, WEBP (max 10MB)</span>
            </label>
          )}
        </div>

        {/* Attachments (เฉพาะโหมดสร้างใหม่) */}
        {!editId && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">ไฟล์แนบ</p>
            <input type="file" multiple accept=".pdf,.doc,.docx,image/*"
              onChange={handleFiles} className="hidden" id="attachments" />
            <label htmlFor="attachments"
              className="flex items-center gap-2 text-sm text-amber-600 font-semibold cursor-pointer hover:text-amber-700 transition-colors w-fit">
              <span>📎</span> เพิ่มไฟล์แนบ
            </label>
            {attachments.length > 0 && (
              <ul className="mt-3 space-y-1">
                {attachments.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span>📄</span>
                    <span className="flex-1">{f.name}</span>
                    <span className="text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
                    <button type="button" onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Featured */}
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
            {saving ? 'กำลังบันทึก...' : editId ? '💾 บันทึกการแก้ไข' : '💾 บันทึกร่าง'}
          </button>
          {!editId && user && ['Editor', 'Admin'].includes(user.role) && (
            <button type="button" disabled={saving}
              onClick={e => handleSubmit(e as React.FormEvent, true)}
              className="px-6 bg-amber-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-60 transition-colors">
              🚀 เผยแพร่
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
