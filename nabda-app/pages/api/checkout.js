import { getSessionFromReq } from '../../lib/auth';
import { chargeWithNonce } from '../../lib/authorizeNet';
import { saveSubscription } from '../../lib/db';

const PLAN_PRICES = {
  'أساسية': 1900,
  'نمو': 3600,
  'احترافية': 6200,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: 'لازم تسجل دخول الأول' });
  }

  const { plan, dataDescriptor, dataValue } = req.body || {};
  const amount = PLAN_PRICES[plan];

  if (!amount) {
    return res.status(400).json({ error: 'باقة غير معروفة' });
  }
  if (!dataDescriptor || !dataValue) {
    return res.status(400).json({ error: 'بيانات الدفع ناقصة' });
  }

  try {
    const result = await chargeWithNonce({
      dataDescriptor,
      dataValue,
      amount,
      invoiceNumber: `INV-${Date.now()}`,
      customerEmail: session.email,
    });

    if (!result.success) {
      return res.status(402).json({
        error: 'تعذر إتمام عملية الدفع',
        details: result.errors,
      });
    }

    saveSubscription({
      email: session.email,
      plan,
      amount,
      transactionId: result.transactionId,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      transactionId: result.transactionId,
    });
  } catch (err) {
    console.error('Authorize.Net error:', err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر أثناء الدفع' });
  }
}
