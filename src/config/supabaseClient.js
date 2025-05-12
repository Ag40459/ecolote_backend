const { createClient } = require("@supabase/supabase-js");
const { supabaseUrl, supabaseServiceKey } = require("./environment");

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Key is missing. Check your .env file.");
    // Em um cenário real, você poderia querer lançar um erro ou sair do processo
    // process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        // autoRefreshToken: true, // default
        // persistSession: true, // default, mas não relevante para service_role no backend
        // detectSessionInUrl: false // default, não relevante para backend
    }
});

module.exports = supabase;

