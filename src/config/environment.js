require('dotenv').config();

const environment = {
    port: process.env.PORT || 3001,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY
};

module.exports = environment;

