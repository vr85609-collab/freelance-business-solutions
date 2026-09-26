# Quail Valley Jewelers website

Next.js catalog and owner dashboard for Vercel. This is a showroom/inquiry experience, not checkout. It does not copy the existing Wix inventory or process payments.

## Local preview

1. `npm install`
2. `npm run dev`
3. Visit `http://localhost:3000`. Without Supabase, the public site displays an empty collection and `/admin` explains setup.

## Owner catalog setup

1. Create a Supabase project. In SQL Editor, run `supabase.sql`.
2. In Supabase Authentication, create or invite the authorized owner as `qvjewelers@gmail.com`. Confirm the email and set a strong password. If the owner uses another email, replace that exact address in every SQL policy before running the script. Do not create public sign-up for this dashboard.
3. Copy the Supabase project URL and anon/publishable key into `.env.local` locally and into Vercel project environment variables named `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These are public client configuration; security depends on the database storage policies. Never use a service-role key in these fields.
4. Deploy by importing this repository into Vercel, using the Next.js preset. Add the two environment variables and redeploy. Visit `/admin` to sign in and add inventory. The public site displays only products marked Visible on website.
5. In Supabase Auth settings, disable public sign-ups if only one owner will use the dashboard. Manage additional editors by adjusting policies to a verified allowlist rather than sharing credentials.

## Launch checklist

- Obtain the business owner's approval to publish their branding and product photos.
- Have the owner verify the address, phone, email, hours, story, descriptions, and prices.
- Add real inventory through `/admin`, including photos. Existing Wix product data is not automatically synced; review availability before copying listings.
- Point the custom domain only after the owner approves and DNS access is available. The existing site remains untouched until then.

## Security and limitations

The browser uses Supabase Auth; row-level security restricts mutations to the allowlisted owner email. Product photos have public read access. Deleting a product leaves its old image in storage; remove unused images in the Supabase Storage console when appropriate. This catalog does not handle checkout, taxes, or inventory quantities. A production online store would need a commerce backend and payment setup.
