import { useState } from 'react';
import Head from 'next/head';
import { getSessionFromReq } from '../lib/auth';
import { useRouter } from 'next/router';

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { session } };
}

const PLANS = [
  { id: 'أساسية', price: 1900, features: ['12 فيديو شهريًا', 'تقرير أداء شهري'] },
  { id: 'نمو', price: 3600, features: ['20 فيديو', 'إدارة إعلانات'] },
  { id: 'احترافية', price: 6200, features: ['محتوى يومي', 'مكالمة أسبوعية'] },
];

// عنوان سكريبت Accept.js: sandbox أثناء التطوير، والرابط الحقيقي وقت الإنتاج
// https://js.authorize.net/v1/Accept.js (production)
// https://jstest.authorize.net/v1/Accept.js (sandbox)
const ACCEPT_JS_SRC =
  process.env.NEXT_PUBLIC_AUTHORIZE_ENVIRONMENT === 'production'
    ? 'https://js.authorize.net/v1/Accept.js'
    : 'https://jstest.authorize.net/v1/Accept.js';

export default function Checkout({ session }) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function getAccept() {
    return typeof window !== 'undefined' ? window.Accept : null;
  }

  async function handlePay(e) {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    const Accept = getAccept();
    if (!Accept) {
      setStatus('تعذر تحميل بوابة الدفع، جرب تاني.');
      setLoading(false);
      return;
    }

    const [expMonth, expYear] = card.exp.split('/').map((s) => s.trim());

    const secureData = {
      authData: {
        clientKey: process.env.NEXT_PUBLIC_AUTHORIZE_CLIENT_KEY,
        apiLoginID: process.env.NEXT_PUBLIC_AUTHORIZE_API_LOGIN_ID,
      },
      cardData: {
        cardNumber: card.number.replace(/\s+/g, ''),
        month: expMonth,
        year: expYear,
        cardCode: card.cvc,
      },
    };

    Accept.dispatchData(secureData, async (response) => {
      if (response.messages.resultCode === 'Error') {
        const msg = response.messages.message.map((m) => m.text).join(' | ');
        setStatus(`خطأ في بيانات الكارت: ${msg}`);
        setLoading(false);
        return;
      }

      const opaqueData = response.opaqueData; // { dataDescriptor, dataValue }

      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: selectedPlan.id,
            dataDescriptor: opaqueData.dataDescriptor,
            dataValue: opaqueData.dataValue,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(data.error || 'تعذر إتمام الدفع');
          return;
        }
        setStatus('تم الدفع بنجاح! جاري تحويلك...');
        setTimeout(() => router.push('/dashboard'), 1200);
      } catch {
        setStatus('حصل خطأ في الاتصال بالسيرفر');
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <div>
      <Head>
        <script src={ACCEPT_JS_SRC} async></script>
      </Head>

      <div className="topbar">
        <strong>نبضة</strong>
        <span style={{ fontSize: 14, color: 'var(--text-mid)' }}>{session.email}</span>
      </div>

      <div className="wrap" style={{ padding: '40px 28px', maxWidth: 720 }}>
        <h1 style={{ fontSize: 26, marginBottom: 20 }}>اختار باقتك وادفع</h1>

        <div className="plan-list">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`plan-card ${selectedPlan.id === p.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(p)}
            >
              <h3>{p.id}</h3>
              <div className="price">{p.price.toLocaleString('en-US')} ج.م</div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <form onSubmit={handlePay} className="card" style={{ marginTop: 28 }}>
          <div className="field">
            <label>الاسم على الكارت</label>
            <input
              required
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>رقم الكارت</label>
            <input
              required
              inputMode="numeric"
              placeholder="•••• •••• •••• ••••"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label>تاريخ الانتهاء (MM/YY)</label>
              <input
                required
                placeholder="MM/YY"
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: e.target.value })}
              />
            </div>
            <div className="field">
              <label>CVC</label>
              <input
                required
                inputMode="numeric"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'جاري المعالجة...' : `ادفع ${selectedPlan.price.toLocaleString('en-US')} ج.م`}
          </button>
          {status && <p style={{ marginTop: 12, fontSize: 14 }}>{status}</p>}
          <p style={{ marginTop: 14, fontSize: 12, color: 'var(--text-mid)' }}>
            بيانات الكارت بتتشفّر مباشرة عبر Authorize.Net Accept.js ومتوصلش لسيرفرك أبدًا —
            السيرفر بياخد فقط رمز دفع مؤقت (nonce) لإتمام العملية.
          </p>
        </form>
      </div>
    </div>
  );
}
