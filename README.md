# Portfolio

A personal portfolio website.

## Goal

A single place to present who I am, what I have achieved and what I have built: my information, accomplishments and projects.

## Features

- Four sections: About, Projects, Accomplishments (as a timeline) and Contact, plus a hero at the top.
- Dark, modern-tech design (dark theme only). The layout scales to any screen size, from phones to 4K monitors, with fluid margins and type.
- A faint glow that follows the pointer over the hero, and project cards that tilt slightly on hover.
- An interactive terminal in the hero. Type `help`, `about`, `skills`, `projects`, `contact`, `resume` or `clear`; it reads its answers from the page content.
- Projects can be filtered by technology, and each one has an expandable case study.
- A keyboard command palette (Ctrl+K, ⌘K or `/`) to jump to a section, copy the email, open a link or download the resume.
- Animations: staggered hero intro, scroll-reveal of sections and cards, drawing section rules and timeline, active-section nav highlight and a scroll progress bar.
- Mobile navigation: the menu collapses behind a toggle button below 720px wide.
- Accessibility: skip link, visible focus styles, ARIA labels on navigation and sections, and everything works from the keyboard. The pointer glow and card tilt are turned off on touch devices (`pointer: coarse`) and when the visitor prefers reduced motion. With reduced motion, animations are also skipped and content shows immediately. Without JavaScript the content still shows; only the interactive extras are missing.

## Tech

Plain HTML, CSS and JavaScript. No build step and no dependencies. Fonts come from Google Fonts: Inter (text) and JetBrains Mono (labels).

## Project structure

```
index.html   Page markup and all content
style.css    Styles, colors, fonts, layout, animations
script.js    Scroll reveal, nav, hero glow and tilt, project filter, terminal, command palette
```

## Status

All content is currently placeholder text.
