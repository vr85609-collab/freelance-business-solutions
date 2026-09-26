-- Run in Supabase SQL Editor. Create the owner user in Authentication > Users.
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 120),
 category text not null check (category in ('Rings','Necklaces','Earrings','Bracelets','Watches','Other')),
 description text not null default '',
 price numeric(12,2) check (price >= 0),
 image_url text,
 featured boolean not null default false,
 published boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Public can view published products" on public.products for select to anon using (published = true);
create policy "Owner can view all products" on public.products for select to authenticated using ((select auth.jwt()->>'email') = 'qvjewelers@gmail.com');
create policy "Owner can add products" on public.products for insert to authenticated with check ((select auth.jwt()->>'email') = 'qvjewelers@gmail.com');
create policy "Owner can edit products" on public.products for update to authenticated using ((select auth.jwt()->>'email') = 'qvjewelers@gmail.com') with check ((select auth.jwt()->>'email') = 'qvjewelers@gmail.com');
create policy "Owner can delete products" on public.products for delete to authenticated using ((select auth.jwt()->>'email') = 'qvjewelers@gmail.com');
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']) on conflict (id) do nothing;
create policy "Public can view product photos" on storage.objects for select to anon using (bucket_id = 'product-images');
create policy "Owner can upload product photos" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (select auth.jwt()->>'email') = 'qvjewelers@gmail.com');
