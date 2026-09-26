# VR Forge Digital

**Websites, apps, and systems built around your business.**

VR Forge Digital is the freelance development business of Victor Rodriguez. The site explains three services, provides a project inquiry form, and includes a sample workflow dashboard that visitors can try.

## Services

| Service | Starting range | Scope |
| --- | ---: | --- |
| Website Repair | $100–$250 | Mobile, layout, link, content, and basic performance fixes |
| Business Landing Page | $99/month | Responsive managed website, hosting/SSL, lead capture, basic SEO, routine content updates, and support |
| Workflow Dashboard | $750–$2,000+ | Forms, tracking, reporting, and exports |

Website Repair and Workflow Dashboard prices depend on final project scope. The Business Landing Page is offered as a $99/month managed subscription with no large upfront website fee. The contact form currently uses FormSubmit and sends to `victorfreelancebusiness@gmail.com`. If the business email changes, update the visible mailto links, form action, hidden subject, and form error copy together. FormSubmit setup and inbox delivery should be verified in the destination mailbox before treating the form as live.

## Brand

The existing VR monogram remains the brand mark. See [BRAND.md](BRAND.md) for naming, copy, palette, and usage. The existing Vercel URL and repository path remain unchanged to preserve links until a new domain is selected and configured.

## Sample workflow dashboard

`demo.html` lets visitors submit sample requests, change statuses, search/filter records, watch dashboard counts update, and export CSV. It stores data in the visitor's browser with `localStorage`; it does not contain client records or a production backend.

## Deployment

This is a static Vercel project configured in `vercel.json`. Vercel can deploy the `main` branch with no build command or environment variables. Verify the production URL after deployment and test the form from the published origin.

## Files

- `index.html`, `styles.css`, `script.js`: main site and contact form
- `demo.html`, `demo.css`, `demo.js`: interactive sample dashboard
- `assets/vr-logo.svg`: existing VR monogram with updated accessible title
- `BRAND.md`: brand rules and reusable copy
- `vercel.json`: Vercel settings and response headers
