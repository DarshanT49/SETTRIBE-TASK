export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least 1 number');
  return errors;
}

export function validateMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\s/g, ''));
}

export function validateRequired(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function validateUrl(url) {
  if (!url) return true; // Optional fields
  try { new URL(url); return true; } catch { return false; }
}

export function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
  if (score <= 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
  if (score <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
  if (score <= 4) return { label: 'Strong', color: 'bg-emerald-500', width: '80%' };
  return { label: 'Very Strong', color: 'bg-green-500', width: '100%' };
}
