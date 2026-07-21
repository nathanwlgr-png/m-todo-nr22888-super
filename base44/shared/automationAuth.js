export async function getOptionalUser(base44) {
  try {
    return await base44.auth.me();
  } catch (_) {
    return null;
  }
}

export function isForbiddenManualUser(user) {
  return Boolean(user && user.role !== 'admin');
}

export async function getAutomationEmail(base44, user) {
  if (user?.email) return user.email;
  const admins = await base44.asServiceRole.entities.User
    .filter({ role: 'admin' }, '-created_date', 1)
    .catch(() => []);
  return admins[0]?.email || 'automacao@nr22888.local';
}