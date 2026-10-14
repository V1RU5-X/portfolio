# Portfolio

A personal portfolio website.

## Goal

A single place to present who I am, what I have achieved and what I have built: my information, accomplishments and projects.

## Features

- Four sections: About, Projects, Accomplishments (as a timeline) and Contact, plus a hero at the top.
- Bold design with light and dark mode. The theme follows the visitor's system setting (`prefers-color-scheme`); there is no manual toggle.
- Cursor effects on desktop: a trailing dot and ring cursor, a hero spotlight that follows the pointer, and project cards that tilt toward the pointer with a shine.
- Scroll-reveal: sections and cards fade in as they enter the viewport.
- Mobile navigation: the menu collapses behind a toggle button below 720px wide.
- Accessibility: skip link, visible focus styles, ARIA labels on navigation and sections. The cursor effects are turned off on touch devices (`pointer: coarse`) and when the visitor prefers reduced motion. With reduced motion, scroll-reveal is also skipped and content shows immediately.

## Tech

Plain HTML, CSS and JavaScript. No build step and no dependencies. Fonts come from Google Fonts: Bricolage Grotesque (headings) and Figtree (body text).

## Project structure

```
index.html   Page markup and all content
style.css    Styles, colors, fonts, layout, animations
script.js    Scroll reveal, mobile nav, cursor effects
```

## Status

All content is currently placeholder text.
