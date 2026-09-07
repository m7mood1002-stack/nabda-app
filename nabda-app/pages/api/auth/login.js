import { findUserByEmail } from '../../../lib/db';
import { verifyPassword, signSession, setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  const user = findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  }

  const token = signSession({ email: user.email, name: user.name });
  setSessionCookie(res, token);

  return res.status(200).json({ ok: true, user: { name: user.name, email: user.email } });
}
