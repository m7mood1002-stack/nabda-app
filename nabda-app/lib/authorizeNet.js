// عميل بسيط لـ Authorize.Net REST API (JSON API).
// التوثيق الرسمي: https://developer.authorize.net/api/reference/

const SANDBOX_URL = 'https://apitest.authorize.net/xml/v1/request.api';
const PRODUCTION_URL = 'https://api.authorize.net/xml/v1/request.api';

function getEndpoint() {
  return process.env.AUTHORIZE_ENVIRONMENT === 'production'
    ? PRODUCTION_URL
    : SANDBOX_URL;
}

/**
 * ينفذ عملية شحن (charge) باستخدام payment nonce جاي من Accept.js في المتصفح.
 * @param {Object} params
 * @param {string} params.dataDescriptor - جاي من استجابة Accept.js
 * @param {string} params.dataValue - جاي من استجابة Accept.js (الـ nonce)
 * @param {number} params.amount - المبلغ بالدولار/الجنيه حسب إعداد حسابك
 * @param {string} params.invoiceNumber - رقم مرجعي للطلب
 * @param {string} params.customerEmail
 */
export async function chargeWithNonce({
  dataDescriptor,
  dataValue,
  amount,
  invoiceNumber,
  customerEmail,
}) {
  const requestBody = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: process.env.AUTHORIZE_API_LOGIN_ID,
        transactionKey: process.env.AUTHORIZE_TRANSACTION_KEY,
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: amount.toFixed(2),
        payment: {
          opaqueData: {
            dataDescriptor,
            dataValue,
          },
        },
        order: {
          invoiceNumber,
        },
        customer: {
          email: customerEmail,
        },
      },
    },
  };

  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  // Authorize.Net بيرجع أحيانًا BOM في بداية الرد، فبنشيله قبل الـ parse
  const raw = await response.text();
  const cleaned = raw.replace(/^\uFEFF/, '');
  const data = JSON.parse(cleaned);

  const resultCode = data?.messages?.resultCode;
  const success = resultCode === 'Ok';

  return {
    success,
    transactionId: data?.transactionResponse?.transId || null,
    authCode: data?.transactionResponse?.authCode || null,
    errors:
      data?.transactionResponse?.errors ||
      data?.messages?.message ||
      null,
    raw: data,
  };
}
