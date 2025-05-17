const verificationCodes = new Map();

// Gera um código aleatório de 6 dígitos
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Armazena um código para um email específico
const storeVerificationCode = (email, code) => {
  // Define o tempo de expiração (10 minutos)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  verificationCodes.set(email.toLowerCase(), {
    code,
    expiresAt,
    attempts: 0
  });
};

// Verifica se um código é válido para um email
const verifyCode = (email, code) => {
  const emailLower = email.toLowerCase();
  const verification = verificationCodes.get(emailLower);
  
  if (!verification) {
    return { valid: false, message: 'Código de verificação expirado ou não encontrado' };
  }
  
  // Incrementa o número de tentativas
  verification.attempts += 1;
  
  // Verifica se o código expirou
  if (new Date() > verification.expiresAt) {
    verificationCodes.delete(emailLower);
    return { valid: false, message: 'Código de verificação expirado' };
  }
  
  // Verifica se excedeu o número máximo de tentativas (5)
  if (verification.attempts > 5) {
    verificationCodes.delete(emailLower);
    return { valid: false, message: 'Número máximo de tentativas excedido' };
  }
  
  // Verifica se o código está correto
  if (verification.code !== code) {
    return { valid: false, message: 'Código de verificação inválido' };
  }
  
  // Se chegou aqui, o código é válido
  verificationCodes.delete(emailLower);
  return { valid: true };
};

module.exports = {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode
};