import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Logs temporales para depuración en web / Android
// (se pueden quitar cuando confirmes que todo funciona bien)
console.log('SUPABASE URL:', supabaseUrl);
console.log('SUPABASE KEY:', supabaseAnonKey ? '[PRESENTE]' : '[NO DEFINIDA]');

let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
	);
} else {
	supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
