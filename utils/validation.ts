// Fonctions de validation

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
  }
  return { valid: true };
}

export function validateEventTitle(title: string): { valid: boolean; message?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, message: 'Le titre est requis' };
  }
  if (title.length > 200) {
    return { valid: false, message: 'Le titre ne peut pas dépasser 200 caractères' };
  }
  return { valid: true };
}

export function validateDate(date: Date): { valid: boolean; message?: string } {
  if (!date || isNaN(date.getTime())) {
    return { valid: false, message: 'Date invalide' };
  }
  return { valid: true };
}

