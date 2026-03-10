import { useEffect } from 'react';

export function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          นโยบายความเป็นส่วนตัว
        </h1>

        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. บทนำ</h2>
            <p>
              CSNews เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ แถลงการณ์นโยบายความเป็นส่วนตัวนี้จะอธิบายถึงวิธีที่เราเก็บรวบรวม ใช้ และป้องกันข้อมูลส่วนบุคคลของคุณเมื่อคุณเข้าใช้งานเว็บไซต์ของเรา
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. ข้อมูลที่เราเก็บรวบรวม</h2>
            <p>
              เราอาจเก็บรวบรวมข้อมูลต่อไปนี้เมื่อคุณใช้งานเว็บไซต์:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>ข้อมูลประจำตัว: ชื่อผู้ใช้งาน, อีเมล (เมื่อลงทะเบียนบัญชี)</li>
              <li>ข้อมูลการใช้งาน: ที่อยู่ IP, ประเภทเบราว์เซอร์, หน้าที่เข้าชม และเวลาที่ใช้งาน</li>
              <li>คุกกี้ (Cookies): เพื่อช่วยให้คุณเข้าใช้งานระบบได้สะดวกขึ้น</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. การใช้ข้อมูลของคุณ</h2>
            <p>
              เราใช้ข้อมูลที่เราจัดเก็บเพื่อวัตถุประสงค์ดังต่อไปนี้:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>เพื่อให้บริการและบริหารจัดการบัญชีผู้ใช้งานของคุณ</li>
              <li>เพื่อปรับปรุงเนื้อหาและประสบการณ์การใช้งานเว็บไซต์</li>
              <li>เพื่อติดต่อสื่อสารหรือตอบกลับคำขอของคุณ</li>
              <li>เพื่อความปลอดภัยและป้องกันการใช้งานที่ผิดกฎหมาย</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. ความปลอดภัยของข้อมูล</h2>
            <p>
              เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อป้องกันการเข้าถึงข้อมูลส่วนบุคคลของคุณโดยไม่ได้รับอนุญาต อย่างไรก็ตาม โปรดทราบว่าไม่มีวิธีการส่งผ่านข้อมูลทางอินเทอร์เน็ตที่ปลอดภัย 100%
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. การเปิดเผยข้อมูลแก่บุคคลที่สาม</h2>
            <p>
              เราจะไม่ขายหรือเช่าข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอก เว้นแต่จะระบุไว้ในนโยบายนี้ หรือเมื่อกฎหมายบังคับ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. การเปลี่ยนแปลงนโยบาย</h2>
            <p>
              เราอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงใดๆ จะถูกโพสต์ในหน้านี้เพื่อให้คุณทราบ
            </p>
          </section>

          <footer className="mt-12 pt-8 border-t border-slate-100 italic text-sm text-slate-500">
            ปรับปรุงล่าสุดเมื่อ: 11 มีนาคม 2569
          </footer>
        </div>
      </div>
    </div>
  );
}
