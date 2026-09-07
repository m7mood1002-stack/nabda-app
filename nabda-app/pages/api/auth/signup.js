import { findUserByEmail, createUser } from '../../../lib/db';
import { hashPassword, signSession, setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبين' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'في حساب مسجل بالبريد ده بالفعل' });
  }

  const passwordHash = await hashPassword(password);
  const user = createUser({
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  const token = signSession({ email: user.email, name: user.name });
  setSessionCookie(res, token);

  return res.status(201).json({ ok: true, user: { name: user.name, email: user.email } });
}
