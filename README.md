# Mbeks Travels website

The static website for Mbeks Travels (*Turning journeys into stories.*). It's plain HTML, CSS and JavaScript, with no build step. To view it, open `index.html` in a browser or upload the folder to any static host (Netlify, Vercel, cPanel).

## Folder structure

```
index.html            Homepage
about.html            About: story, who we serve, why Mbeks
experience.html       All 6 experiences (anchors: #wildlife-safaris, #staycations …)
destinations.html     All destinations (anchors: #uganda, #kenya …)
gallery.html          Filterable photo gallery with lightbox
blog.html             Blog listing
blog/*.html           Blog articles (drafts: client to review)
contacts.html         Contact details + WhatsApp enquiry form

styles/
  style.css           Global: design tokens, buttons, header, footer (every page)
  sections.css        Homepage-style sections shared by all pages: light-yellow
                      sections, sticky split, How it works, photo band,
                      stacking panels (Experiences, Destinations)
  home.css            Homepage sections only
  pages.css           Inner pages only

scripts/
  main.js             Every page: sticky header, mobile menu, booking tracking,
                      testimonials, cursor badges, Moments, reveals
  gallery.js          Gallery filters + lightbox
  contact.js          Enquiry form → WhatsApp message

assets/
  images/brand/       Logo: original PNG, logo-160/320.webp (header, footer),
                      favicon-48.png, apple-touch-icon.png, logo-512.png (Google)
  images/photos/      Photos as <name>-800.webp (-1600.webp for page banners)
  images/originals/   Full-size originals of the client's own photos and video,
                      renamed to match. Not used by the site: keep them out of
                      the upload to save ~67 MB
  video/              Homepage hero video: hero.webm + hero.mp4 (silent, looping)
                      and hero-poster.webp (first frame, shown while loading)

robots.txt, sitemap.xml
```

The header, mobile menu, footer and floating WhatsApp button are repeated in every page. If you change a nav link or a phone number, update it in all HTML files (search and replace works well).

## Design system

The colours, fonts and spacing are CSS variables at the top of `styles/style.css`.

- **Colours (from the logo):** green `#02341B` (primary buttons, dark sections, footer) and gold `#F2B806` (nav "Book a Trip" button, "Experience." in the hero, the Explore Tours badge, highlights). Eyebrow labels and emphasised words on light backgrounds are also gold. Light sections use white and `#FCF6E1`, which is `rgba(240, 208, 105, .2)` on white.
- **Fonts (matched to the logo):** Coustard (regular weight) for headings ("Mbeks"), Kaushan Script for script labels ("Travels") and Montserrat for body text (the tagline).
- **Text:** pure white `#FFFFFF` on dark backgrounds and photos, and pure black `#000000` on light ones.
- **Buttons:** `btn--leaf` (green) is the primary button everywhere; `btn--outline` is the secondary. `btn--gold` is the nav button only.

Sections use theme classes:

- `section` is dark green by default (Moments, footer).
- `theme-light` (white) and `theme-sand` (both white `#FFFFFF`; cards use the light yellow `--light-alt`) give the light sections.

Components read the semantic tokens (`--text`, `--bg` …), so the same markup works on light and dark backgrounds.

## WhatsApp links and tracking

Every Book a Trip link is `https://wa.me/256706580418?text=…` with a pre-filled message. Clicks on any `wa.me` link push a `book_trip_click` event (with a `topic`) to `dataLayer` and to `gtag()` if they're installed. Add your Google Tag Manager or GA4 snippet to the `<head>` of each page to record the events.

## Before launch (open items)

1. **Photos:** every photo is a free stock placeholder (Unsplash). Replace each file in `assets/images/photos/` with the client's own photo, using the **same filename**. Export WebP at 800px wide, and also at 1600px for the hero and large tiles, then add `srcset`. Keep the hero under 400 KB and tiles under 250 KB. Update the `alt` text to describe the real photo.
2. **Social share image:** Open Graph uses the 800px hero WebP. For the best previews on WhatsApp and Facebook, add a 1200×630 JPG and point `og:image` at it on every page.
3. **Logo:** if the logo changes, replace `assets/images/brand/mbeks-travels-logo.png` and re-export the smaller sizes with the same filenames.
4. **Testimonials:** the four quotes on the homepage, and the names on them, are made-up placeholders. Replace them with real reviews and names (with permission), or remove the section.
5. **Social links:** the icons in the footer are disabled. When the URLs arrive, change each `<span class="social">` to `<a class="social" href="…" aria-label="…">`, and point the Moments button at Instagram.
6. **Founder photo:** about.html has a placeholder panel.
7. **Blog:** the three articles are drafts for the client to edit or replace.
8. **Domain:** canonical URLs, Open Graph images, `sitemap.xml` and `robots.txt` use `https://mbekstravels.com`. Change it if the live domain is different.
9. **Fonts:** the three fonts load from Google Fonts. For faster loading and privacy, they can be self-hosted later.

## Later (needs a CMS or static-site generator)

The brief asks for client-editable blog posts, testimonials, gallery and destinations, plus a separate URL for each experience and country (`/destinations/uganda`). That needs a CMS (e.g. Decap CMS, Webflow) or a generator such as Eleventy or Astro. The current markup and CSS carry over to either without changes.
