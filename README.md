# Broomfield County Republicans Website

Ground-up redesign of broomfieldrepublicans.org with a **TPUSA-inspired aesthetic**: bold all-caps display type (Bebas Neue), full-bleed hero photography, dark sections, agitation-tone headlines, scrolling marquee, and a sharp red/black/navy color system. Static HTML, no build step, no CMS to babysit. Open any `.html` file in a browser to preview.

## What's here

```
site/
├── index.html              ← Homepage
├── about.html              ← Mission, officers, districts, bylaws
├── 2026-election.html      ← Key dates, races, voter info
├── events.html             ← Google Calendar embed + recurring meetings
├── get-involved.html       ← Volunteer roles + signup form
├── contribute.html         ← Tier cards, one-time donate, FAQ
├── news.html               ← Article cards, subscribe CTA
├── contact.html            ← Direct email + contact form
├── redwave.html            ← Standalone animated "Red Wave 2026" social graphic
├── assets/
│   ├── styles.css          ← Single shared stylesheet (brand colors, layout, components)
│   └── script.js           ← Mobile menu toggle + active-link highlighting
├── _partials.html          ← Reference only (header/footer notes)
└── README.md               ← This file
```

## Brand kit (already wired in)

Pulled from the live site so colors match exactly:

- **Republican Red:** `#C22600` (primary CTA, accent)
- **Bright Red:** `#E62F00` (highlight, headline accents)
- **Patriot Navy:** `#002F61` (secondary dark surfaces)
- **Black:** `#0A0A0A` (dominant dark sections, TPUSA energy)
- **White:** `#FFFFFF`
- **Logo:** loaded from the existing Squarespace CDN. URL: `https://static1.squarespace.com/static/5ddc62c1b3ebf77e44ea17de/t/6754027bd4b4867eee40558f/1733558907646/BCRCLogo-largenb.png`
- **Display font:** Bebas Neue (huge all-caps headlines, free via Google Fonts)
- **Body font:** Inter (clean, readable, modern, free via Google Fonts)
- **Hero imagery:** Unsplash placeholder photos with dark overlays. Replace with real Broomfield event photos when available.

To change a color globally, edit the `:root` block at the top of `assets/styles.css`. Every page picks it up automatically.

## How to update content

### Red Wave social graphic (`redwave.html`)
Standalone animated graphic. Open the file in any browser. The animation auto-plays and loops every 8 seconds: a red wave rises from below and floods a stylized Broomfield County silhouette, then resets.

**To share on social:**
1. Open `redwave.html` in a full-screen browser tab.
2. Either click "Download Current Frame (PNG)" for a still, or use your OS screen recorder for a video clip:
   - Windows: press Win+G to open Game Bar, click the record button, capture one full 8-second loop, then trim.
   - macOS: press Cmd+Shift+5, choose record selection, capture the loop.
3. Post the PNG (1080×1080, perfect for Instagram and X) or the screen recording (perfect for Reels, Stories, TikTok).

**Legal note:** the graphic is intentionally stylized so it does NOT replicate the official City and County of Broomfield seal. The page also includes a visible disclaimer that this is a campaign graphic, not an official government emblem. Don't remove that disclaimer.

To customize the wave timing, edit the `@keyframes rise` block in the file's `<style>`. Slow it down by changing `8s` to `12s`, or change the colors by adjusting the fill values.

### Hero photos
The homepage hero and every inner page header use Unsplash placeholder photos with a dark overlay. To swap one out:
1. Open the relevant `.html` file.
2. Find the `style="background-image: url('https://images.unsplash.com/...')"` attribute.
3. Replace the URL with your own image. For your own photos, host them on the site (e.g. in an `assets/img/` folder) and use a relative path: `style="background-image: url('assets/img/rally.jpg')"`.
4. The dark overlay ensures text stays readable over any image.

For free stock options, search Unsplash for `american flag`, `rally`, `town hall`, `voting`, or `crowd` and grab the direct image URL.

### Marquee ticker
The scrolling red ticker on the homepage lives in `<div class="marquee">` near the top. Edit the `<span>` items to change the messages. Duplicate the full set so it loops smoothly.

### Stats counters
The four big numbers below the hero are in the `<div class="stats">` block. Update the numbers and labels to reflect real Broomfield data when you have it (e.g. number of registered Republicans, volunteers, events held last year).

### Calendar / Events
Replace the placeholder Google Calendar with your own:
1. In Google Calendar, click the gear → **Settings** → pick the calendar in the left sidebar.
2. Scroll to **Integrate calendar** → copy the **Embed code** iframe.
3. In `events.html`, find the `<iframe>` inside the section marked `GOOGLE CALENDAR EMBED` (look for the comment block) and paste the new `src="..."` value. That's it. Events update live going forward.
4. Optionally, copy the **Public URL to this calendar** and paste into the "Subscribe to Calendar" button on the same page.

### Volunteer & contact forms
Both forms use [FormSubmit.co](https://formsubmit.co), which is free, with no signup. You just verify your email once.
1. Open `get-involved.html` and `contact.html`.
2. Find `action="https://formsubmit.co/YOUR_EMAIL_HERE"` and replace `YOUR_EMAIL_HERE` with the email that should receive submissions (e.g. `Chairman@BroomfieldRepublicans.org`).
3. Submit the form once yourself. FormSubmit will email a verify link. Click it.
4. Done. Submissions land in your inbox.

If you'd rather use your existing **Formstack** form (`ccobroomfield.formstack.com/forms/b_in_the_loop`), replace the entire `<form>` block in either page with the embed code Formstack provides.

### Donate buttons
Right now the donation buttons in `contribute.html` are placeholders (`href="#"`). Swap them for your real processor:
- **WinRed:** `https://winred.com/yourpage/donate?amount=25`
- **Anedot:** `https://anedot.com/yourpage?amount=25`
- **Stripe Payment Links:** `https://buy.stripe.com/yourlink`
- **Squarespace donate page:** keep the current URL if you want to keep donations on-site.

Find the `DONATION LINKS` comment block in `contribute.html` and update the `href` on each button (`$25`, `$50`, `$100`, `$250`, `$500`, Other).

### Officers, district captains, news articles
Open the relevant page and edit the text directly. Each card is just HTML. Change the `<h3>`, `<p>`, and email/links as needed. No build step required.

### Updating the nav or footer
The header and footer are duplicated on every page (deliberately, to keep it simple and dependency-free). If you change the nav, you'll need to update **all 8 pages**. The fastest way:
1. Open the project folder in VS Code (free at code.visualstudio.com).
2. Press `Cmd+Shift+H` (Mac) or `Ctrl+Shift+H` (Windows) for project-wide find-and-replace.
3. Paste in the old block, paste in the new block, hit replace all.

Alternatively, ask your developer to convert this to use a build step (Eleventy, Astro, or plain PHP includes all work).

## Hosting / deploy

This is plain HTML with no build step, so any static host will work. Easy options:
- **Netlify:** drag-and-drop the `site/` folder onto netlify.com. Free, instant, supports custom domains.
- **GitHub Pages:** push to a repo, enable Pages. Free.
- **Squarespace:** keep the current host. Replace each page's content with the equivalent block, or use Squarespace's **Code Block** to drop the HTML in directly. (You'll lose Squarespace's calendar; use the Google Calendar embed instead.)
- **Cloudflare Pages / Vercel:** also free, also instant.

If you stay on Squarespace, the easiest path is to use Squarespace's "Custom CSS" panel to paste in the contents of `assets/styles.css`, then rebuild each page section using their blocks. Or migrate off. This static version is faster to load, easier to edit, and free to host.

## What's intentionally NOT here

- **No tracking pixels.** The current site has Google Tag Manager and Facebook Pixel. We left them out by default. Add them back in `<head>` if you want analytics or retargeting.
- **No login or member portal.** Everything is public-facing.
- **No CMS.** Content lives in HTML. If you want a CMS later, options like Sanity, Decap, or Webflow can wrap this without breaking the design.

## Strategy notes (per project goals)

The redesign is built around the four goals you confirmed: **recruit volunteers**, **drive donations**, **promote events**, **inform voters**. Every page funnels toward one of those four. No dead-ends.

A few things baked into the design that target the **18 to 40 demo**:
- Sticky nav with always-visible **Volunteer** and **Contribute** CTAs (younger users decide fast and need an obvious next step).
- **Card-based layouts** instead of dense paragraphs (mobile-first, scannable).
- **One CTA per section.** Never make a visitor choose between two equally weighted asks.
- **Visible monthly donation tier** ($17.76 Patriot Club featured prominently). Recurring giving is what younger donors actually do.
- **Live Google Calendar embed** on the Events page (familiar UX from work calendars and social events).
- **Honest disclosures** in the donate flow. Younger donors are skeptical and reward transparency.
- **Modern type, generous whitespace.** Looks like a 2026 site, not a 2014 site, while staying respectful of the brand.

## Questions / next steps

If you want a follow-up:
- **Strategy doc:** a written companion to this site covering content cadence, social, fundraising, and volunteer pipeline.
- **Logo refresh:** the current PNG is fine but a vector SVG would be sharper at every size and load faster.
- **Photography:** replacing stock with real photos of Broomfield events makes a big difference. Even phone photos work if framed well.
- **Newsletter system:** moving from Formstack to Mailchimp, Beehiiv, or ConvertKit for richer analytics.
