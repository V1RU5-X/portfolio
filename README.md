# Portfolio

A personal portfolio website.

## Goal

A single place to present who I am, what I have achieved and what I have built: my information, accomplishments and projects.

## Features

- Four sections: About, Projects, Accomplishments (as a timeline) and Contact, plus a hero at the top.
- Dark, modern-tech design (dark theme only). The layout scales to any screen size, from phones to 4K monitors, with fluid margins and type.
- An interactive dot field behind the page: dots light up and shift away from the pointer (or a touch), then spring back. Project cards tilt slightly on hover.
- A code-editor panel in the hero whose code types itself out once when it scrolls into view.
- Decode effect on headings: the hero title and section headings scramble through random characters and settle into the real text.
- Projects are compact tiles that swap to a screenshot on hover and open a detail view with links and the case study.
- Projects can be filtered by technology.
- A keyboard command palette (Ctrl+K, ⌘K or `/`) to jump to a section, copy the email, open a link or download the resume.
- Animations: staggered hero intro, scroll-reveal of sections and cards, drawing section rules and timeline, active-section nav highlight and a scroll progress bar.
- Mobile navigation: the menu collapses behind a toggle button below 720px wide.
- Accessibility: skip link, visible focus styles, ARIA labels on navigation and sections, and everything works from the keyboard. Card tilt is turned off on touch devices (`pointer: coarse`) and when the visitor prefers reduced motion. With reduced motion, animations, the typing and decode effects are skipped, the dots stay still and content shows immediately. Without JavaScript the content still shows; only the interactive extras are missing.

## Tech

Plain HTML, CSS and JavaScript. No build step and no dependencies. Fonts come from Google Fonts: Inter (text) and JetBrains Mono (labels).

## Project structure

```
index.html   Page markup and all content
style.css    Styles, colors, fonts, layout, animations
script.js    Scroll reveal, nav, hero dot field, card tilt, code typing, heading decode, project tiles and detail dialog, project filter, command palette
```

## Status

All content is currently placeholder text.
