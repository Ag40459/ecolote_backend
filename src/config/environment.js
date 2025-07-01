require('dotenv').config();

const environment = {
    port: process.env.PORT || 3001,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_KEY
};

console.log('Supabase URL carregada:', environment.supabaseUrl);
console.log('Supabase Service Key carregada:', environment.supabaseServiceKey ? '******' : 'Não definida');

module.exports = environment;

