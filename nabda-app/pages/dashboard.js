import { getSessionFromReq } from '../lib/auth';
import { getSubscriptionsForUser } from '../lib/db';
import { useRouter } from 'next/router';
import Link from 'next/link';

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  const subscriptions = getSubscriptionsForUser(session.email);
  return { props: { session, subscriptions } };
}

export default function Dashboard({ session, subscriptions }) {
  const router = useRouter();
  const activePlan = subscriptions[subscriptions.length - 1];

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div>
      <div className="topbar">
        <strong>نبضة</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--text-mid)' }}>أهلًا، {session.name}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>تسجيل الخروج</button>
        </div>
      </div>

      <div className="wrap" style={{ padding: '40px 28px' }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>نظرة عامة على حسابك</h1>
        <p style={{ color: 'var(--text-mid)', marginBottom: 20 }}>
          {activePlan
            ? `مشترك حاليًا في باقة ${activePlan.plan}`
            : 'مفيش باقة مفعّلة دلوقتي.'}
        </p>

        {!activePlan && (
          <Link href="/checkout" className="btn btn-primary" style={{ marginBottom: 32, display: 'inline-block' }}>
            اشترك في باقة
          </Link>
        )}

        <div className="dash-grid">
          <div className="card metric">
            <div className="label">الوصول الكلي</div>
            <div className="value">214K</div>
          </div>
          <div className="card metric">
            <div className="label">معدل التفاعل</div>
            <div className="value">6.4٪</div>
          </div>
          <div className="card metric">
            <div className="label">الاشتراكات</div>
            <div className="value">{subscriptions.length}</div>
          </div>
        </div>

        {subscriptions.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>سجل الفواتير</h2>
            <div className="card">
              {subscriptions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < subscriptions.length - 1 ? '1px solid var(--line)' : 'none',
                    fontSize: 14,
                  }}
                >
                  <span>{s.plan}</span>
                  <span>{s.amount} ج.م</span>
                  <span style={{ color: 'var(--text-mid)' }}>{new Date(s.createdAt).toLocaleDateString('ar-EG')}</span>
                  <span style={{ color: 'var(--text-mid)' }}>#{s.transactionId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
