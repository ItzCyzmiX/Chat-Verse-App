import { createClient } from '@supabase/supabase-js'
//import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from '$env/static/private'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
