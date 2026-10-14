# Portfolio

A personal portfolio website.

## Goal

A single place to present who I am, what I have achieved and what I have built: my information, accomplishments and projects.

## Features

- Four sections: About, Projects, Accomplishments (as a timeline) and Contact, plus a hero at the top.
- Dark, modern-tech design (dark theme only). The layout scales to any screen size, from phones to 4K monitors, with fluid margins and type.
- Cursor effects on desktop: a dot and thin trailing ring that reacts to links and project cards, a hero spotlight that lights up a faint grid, and project cards that tilt slightly with a border highlight.
- Animations: staggered hero intro, scroll-reveal of sections and cards, drawing section rules and timeline, active-section nav highlight and a scroll progress bar.
- Mobile navigation: the menu collapses behind a toggle button below 720px wide.
- Accessibility: skip link, visible focus styles, ARIA labels on navigation and sections. The cursor effects and tilt are turned off on touch devices (`pointer: coarse`) and when the visitor prefers reduced motion. With reduced motion, animations are also skipped and content shows immediately.

## Tech

Plain HTML, CSS and JavaScript. No build step and no dependencies. Fonts come from Google Fonts: Inter (text) and JetBrains Mono (labels).

## Project structure

```
index.html   Page markup and all content
style.css    Styles, colors, fonts, layout, animations
script.js    Scroll reveal, mobile nav, cursor effects
```

## Status

All content is currently placeholder text.
