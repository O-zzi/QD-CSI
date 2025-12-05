# Design Guidelines for The Quarterdeck Platform

## Critical Constraint
**The design must exactly preserve the existing HTML implementation.** All Tailwind classes, spacing, layouts, animations, colors, and UI behaviors from the current index.html must remain identical. This is a migration project, not a redesign.

## Design System Extraction from Existing Implementation

### Color Palette
- **Primary Navy**: `#2a4060` - Main brand color
- **Primary Soft**: `#e2eaf4` - Soft backgrounds
- **Background Main**: `#f5f5f7` - Page background
- **Background Card**: `#ffffff` - Card backgrounds
- **Text Main**: `#1f2933` - Primary text
- **Text Muted**: `#6b7280` - Secondary text
- **Border Soft**: `#e5e7eb` - Borders
- **Gold Accent**: Gradient from `#fef3c7` to `#facc15` to `#cda434` - Used in logo and highlights

### Typography System
- **Font Family**: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Hero Title**: 2.3rem mobile, 2.9rem desktop with -0.03em letter-spacing
- **Body Text**: 0.98rem for subtitles, 0.9rem for buttons
- **Small Text**: 0.78rem-0.8rem for metadata and labels
- **Font Weights**: 600 (semibold) for buttons, 700 (bold) for headings, 800 (extrabold) for logo

### Spacing & Layout
- **Container**: max-width 1120px, 1.5rem horizontal padding
- **Section Padding**: 4.5rem vertical (mobile), 5.5rem (desktop)
- **Common Spacing Units**: Use Tailwind's default scale - primarily 0.75rem, 1.5rem, 2.5rem gaps
- **Navigation Height**: 70px fixed

### Border Radius System
- **Large Cards**: 18px-26px
- **Medium Elements**: 12px-14px
- **Small Components**: 10px
- **Pills/Buttons**: 999px (fully rounded)

### Component Patterns

**Cards**: White background, soft shadows (`0 8px 20px rgba(15, 23, 42, 0.06)`), 20px border-radius, 1.5-1.6rem padding

**Buttons**: 
- Primary: Dark gradient (`#1f2937` to `#2a4060`), pill-shaped, 0.65rem vertical padding
- Outline: White background, 1px border
- Hover: Subtle lift with enhanced shadow

**Navigation**: Sticky header with backdrop blur, underline animation on hover, mobile hamburger at <900px breakpoint

**Hero Section**: Two-column grid (1.4fr + 1fr) on desktop, eyebrow badge with dot indicator, countdown timer with monospace font, gradient text highlights

**Gallery Grid**: 3 columns on desktop (strict), auto-fit 250px minimum on mobile, 1.25rem gap

**Membership Cards**: Badge overlays (top-right), tier-specific colors (Founding: gold, Gold: gray, Silver: gray, Guest: blue)

**Rules/Safety Grid**: 2 columns on desktop, left border accent (5px primary color), soft shadow

### Animation Approach
**Minimal animations** - Use sparingly:
- Fade-in on load (0.4s ease-out)
- Navigation underline slide (0.2s ease)
- Button lift on hover (translateY -1px)
- No scroll-triggered or complex animations

### Booking Console Specifics
Preserve exact UI including:
- Time slot grid with hover states
- Multi-step selection flow
- Toggle switches for matchmaking/coach
- Quantity selectors (+/- buttons) for add-ons
- Membership validation input
- Modal overlays for certification and waiver
- Summary pricing breakdown
- Tab navigation for Bookings/Leaderboard/Events/Profile

### Images
**Logo**: Conic gradient circle (38px) with "Q" letter mark
**Hero**: No large hero image in current design - uses card-based layout instead
**Gallery Section**: Placeholder grid items (200px height, rounded corners) - to be replaced with actual facility images
**Facility Cards**: Include representative images for each facility type

### Critical Preservation Requirements
1. Copy all existing CSS custom properties verbatim
2. Maintain exact Tailwind class combinations
3. Preserve responsive breakpoint at 900px for navigation
4. Keep gradient definitions identical
5. Maintain shadow specifications
6. Preserve countdown timer styling and monospace font
7. Keep exact button padding and sizing
8. Maintain grid template specifications (3-column gallery, 2-column rules)

This is a **conversion project**, not a redesign. Every visual detail must match the existing implementation exactly.