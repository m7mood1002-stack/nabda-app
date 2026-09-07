import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="topbar">
        <strong>نبضة</strong>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn btn-ghost">تسجيل الدخول</Link>
          <Link href="/signup" className="btn btn-primary">إنشاء حساب</Link>
        </div>
      </div>

      <div className="wrap" style={{ padding: '80px 28px' }}>
        <h1 style={{ fontSize: 44, marginBottom: 18, maxWidth: 600 }}>
          نمو حقيقي على تيك توك، مش أرقام مؤقتة.
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: 17, maxWidth: 520, marginBottom: 32 }}>
          نبضة بتدير المحتوى والحملات الإعلانية الرسمية بتاعتك على تيك توك
          وإنستجرام، من غير بوتس ولا لايكات وهمية.
        </p>
        <Link href="/signup" className="btn btn-primary">
          ابدأ دلوقتي
        </Link>
      </div>
    </div>
  );
}
