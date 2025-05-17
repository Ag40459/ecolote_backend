const emailService = require('../services/emailService');
const verificationService = require('../services/verificationService');

/**
 * @route POST /api/verificacao/enviar-codigo
 * @description Envia um código de verificação para o email informado
 * @access Public
 */
const enviarCodigoVerificacao = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }
  
  try {
    // Gera um novo código de verificação
    const code = verificationService.generateVerificationCode();
    
    // Armazena o código
    verificationService.storeVerificationCode(email, code);
    
    // Envia o código por email
    await emailService.sendVerificationCode(email, code);
    
    res.status(200).json({ message: 'Código de verificação enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    res.status(500).json({ message: 'Erro ao enviar código de verificação' });
  }
};

/**
 * @route POST /api/verificacao/validar-codigo
 * @description Valida um código de verificação
 * @access Public
 */
const validarCodigoVerificacao = (req, res) => {
  const { email, codigo } = req.body;
  
  if (!email || !codigo) {
    return res.status(400).json({ message: 'Email e código são obrigatórios' });
  }
  
  const result = verificationService.verifyCode(email, codigo);
  
  if (result.valid) {
    res.status(200).json({ message: 'Código validado com sucesso' });
  } else {
    res.status(400).json({ message: result.message });
  }
};

module.exports = {
  enviarCodigoVerificacao,
  validarCodigoVerificacao
};