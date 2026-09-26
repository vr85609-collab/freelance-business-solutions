import { createClient } from '@supabase/supabase-js';
export const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabase = configured ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) : null;
export type Product = { id:string; name:string; category:string; description:string; price:number|null; image_url:string|null; featured:boolean; published:boolean; created_at?:string };
