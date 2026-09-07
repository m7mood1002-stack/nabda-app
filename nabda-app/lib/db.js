// تخزين مبسط في ملف JSON — مناسب للتجربة والتطوير فقط.
// في الإنتاج الفعلي، استبدل الملف ده بقاعدة بيانات حقيقية
// (Postgres, MySQL, MongoDB...) لأن الكتابة في ملف مش آمنة
// ولا موثوقة لو شغّلت السيرفر على أكتر من نسخة (serverless مثلاً).

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], subscriptions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function findUserByEmail(email) {
  const db = readDB();
  return db.users.find((u) => u.email === email);
}

export function createUser(user) {
  const db = readDB();
  db.users.push(user);
  writeDB(db);
  return user;
}

export function saveSubscription(sub) {
  const db = readDB();
  db.subscriptions.push(sub);
  writeDB(db);
  return sub;
}

export function getSubscriptionsForUser(email) {
  const db = readDB();
  return db.subscriptions.filter((s) => s.email === email);
}
