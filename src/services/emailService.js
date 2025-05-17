const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do transporter do Nodemailer para Zoho Mail
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER, // seu email @ecolote.com.br
    pass: process.env.EMAIL_PASSWORD // senha do email
  }
});

// Função para enviar email com código de verificação
const sendVerificationCode = async (to, code) => {
  try {
    const info = await transporter.sendMail({
      from: `"Ecolote" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Código de Verificação - Ecolote',
      text: `Seu código de verificação é: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4CAF50; text-align: center;">Ecolote - Verificação de Email</h2>
          <p>Olá,</p>
          <p>Obrigado por se cadastrar no Ecolote. Para completar seu cadastro, utilize o código de verificação abaixo:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>Este código é válido por 10 minutos.</p>
          <p>Se você não solicitou este código, por favor ignore este email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            © ${new Date().getFullYear()} Ecolote. Todos os direitos reservados.
          </p>
        </div>
      `
    });

    console.log('Email enviado: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Não foi possível enviar o email de verificação');
  }
};

module.exports = {
  sendVerificationCode
};