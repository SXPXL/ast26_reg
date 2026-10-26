---
name: Asthra 26
description: Minimalist Glassmorphic Luxury Festival Portal
colors:
  primary: "#D4AF37"
  primary-bright: "#F5D77F"
  primary-light: "#FFF4D0"
  primary-dark: "#9A7B1C"
  neutral-bg: "#050508"
  neutral-surface: "#0c0c13"
  glass-bg: "rgba(18, 18, 27, 0.65)"
  glass-border: "rgba(212, 175, 55, 0.18)"
  glass-border-hover: "rgba(245, 215, 127, 0.45)"
  text-primary: "#FAF9F6"
  text-secondary: "#A7A296"
  text-muted: "#6B675E"
  accent-green: "#10B981"
  accent-red: "#EF4444"
typography:
  display:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.2rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.03em"
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.primary-bright}"
  button-glass:
    backgroundColor: "{colors.glass-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card-glass:
    backgroundColor: "{colors.glass-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "32px"
---

# Design System: Asthra 26

## Overview

**Creative North Star: "Celestial Obsidian Prism"**

Asthra 26 embodies a luxury minimalist glassmorphic aesthetic set against an infinite obsidian expanse. Rather than utilizing heavy opaque cards or extruded clay neumorphism with dual opposing drop shadows, every card, modal, and interactive container functions as a crystalline, semi-translucent glass prism suspended over velvet darkness. Surfaces breathe through a combination of optical backdrop blur (`16px` to `24px`), ultra-fine metallic gold borders (`1px solid rgba(212, 175, 55, 0.18)`), and subtle top-edge specular illumination.

The system is deliberately restrained. The primary metallic gold palette is reserved for high-impact brand moments—such as the hero headline, key registration callouts, and the primary conversion CTA—while body copy, auxiliary filters, and informational badges float in refined, high-legibility neutrals. The interface achieves weightless luxury without visual clutter.

**Key Characteristics:**
- **Translucent Glass Architecture**: Semi-transparent frosted obsidian surfaces (`rgba(18, 18, 27, 0.65)`) with multi-layer hardware-accelerated blur.
- **Micro-Gold Accents**: Hairline borders and specular edge reflections in warm champagne and Aztec gold.
- **Typography Distinction**: The dramatic Roman serif grandeur of Cinzel paired with the clean, utilitarian geometry of Plus Jakarta Sans.
- **Atmospheric Depth**: Diffuse, soft ambient halos and glows replacing heavy drop shadows.

## Colors

The palette is composed of an ultra-deep obsidian velvet foundation accented with radiant auric golds and crisp ethereal highlights.

### Primary
- **Aztec Gold** (`#D4AF37`): Primary brand signature, used on key borders, hero accents, and brand headers.
- **Sunlit Auric** (`#F5D77F`): High-luminance accent for hover states, gradient tops, and focused active elements.
- **Champagne Highlight** (`#FFF4D0`): Delicate specular highlight used in the linear gold gradient and shine sweep.
- **Deep Auric Bronze** (`#9A7B1C`): Base tone anchoring the bottom edge of the metallic gold gradient.

### Neutral
- **Obsidian Deep** (`#050508`): Canvas root background; an absorbing, infinite night sky tone.
- **Velvet Core** (`#09090e`): Layer foundation for header bars and sticky shells.
- **Frosted Obsidian Glass** (`rgba(18, 18, 27, 0.65)`): The universal container fill for cards, drawers, and modals.
- **Frosted Inset Glass** (`rgba(10, 10, 16, 0.6)`): Recessed glass treatment for form inputs and search bars.
- **Pure Ethereal White** (`#FAF9F6`): Primary readable text and critical titles.
- **Muted Platinum** (`#A7A296`): Secondary metadata, dates, venue labels, and sub-captions.
- **Soft Slate** (`#6B675E`): Placeholders, disabled states, and auxiliary hints.

### Named Rules
**The Golden Rarity Rule.** Metallic gold gradient fills appear on at most one primary CTA button per view or modal. Auxiliary actions must remain glass-tinted with gold borders to preserve the value of the primary action.

**The Translucency Depth Rule.** Never use solid `#12121b` or fully opaque backgrounds for cards or popovers. Surfaces must use alpha transparency (`rgba(18, 18, 27, 0.65)`) with `backdrop-filter: blur(16px)` to allow underlying illumination and gradients to bleed through organically.

## Typography

**Display Font:** Cinzel (fallback: Georgia, serif)  
**Body Font:** Plus Jakarta Sans (fallback: -apple-system, Roboto, sans-serif)  
**Mono Font:** Space Grotesk (fallback: monospace)

**Character:** A high-contrast marriage of classical monumentality and contemporary geometric clarity. Cinzel delivers the prestigious festival atmosphere, while Plus Jakarta Sans delivers effortless legibility for times, fees, and forms.

### Hierarchy
- **Display** (800 weight, `clamp(2.5rem, 6vw, 4.2rem)`, `1.15` line-height): The "Hello there!" hero greeting and primary festival titles. Applied with `.gold-text-glow`.
- **Headline** (700 weight, `1.75rem`, `1.3` line-height): Event titles on detail modals and major section headers.
- **Title** (600 weight, `1.25rem`, `1.4` line-height): Event card headlines and modal subsection banners.
- **Body** (400 weight, `0.95rem`, `1.6` line-height): Event descriptions, rules, instructions, and registration requirements. Max line-length 65ch.
- **Label** (600 weight, `0.75rem`, `1.2` line-height, `0.08em` letter-spacing, uppercase): Status chips, category badges, table column headers.

### Named Rules
**The Regal Display Rule.** All Cinzel titles (`.font-display`) must be styled with letter-spacing of at least `0.03em` and paired with gold clipping or glowing ambient drop-shadow.

## Layout

Asthra 26 uses an isolated, single-column responsive container grid tailored for high scannability:
- **Participant Surface (`/`)**: Uncluttered container (`max-width: 1240px`) featuring the prominent hero greeting and an adaptive 1-to-3 column auto-fill event grid (`minmax(340px, 1fr)`).
- **Volunteer Desk (`/volunteer`)**: High-efficiency operational split with sticky header, live search bar, and direct check-in verification cards (`max-width: 1100px`).
- **Rhythm**: Standard spacing scale based on 8px increments (`8px`, `16px`, `24px`, `32px`, `48px`).

## Elevation & Depth

All heavy, opaque neumorphic double drop-shadows (such as `-8px -8px 18px` light edges paired with `8px 8px 18px` dark shadows) are eliminated in favor of **Weightless Glassmorphic Elevation**.

Depth is created via 4 optical properties:
1. **Backdrop Blur**: `backdrop-filter: blur(16px)` to `blur(24px)`.
2. **Surface Translucency**: `rgba(18, 18, 27, 0.65)`.
3. **Specular Top Light**: `box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.08)`.
4. **Ambient Gold Glow**: On hover, surfaces emit a soft, wide-dispersion gold halo (`0 12px 32px rgba(0, 0, 0, 0.5), 0 0 24px rgba(212, 175, 55, 0.15)`).

### Shadow & Glow Vocabulary
- **Glass Rest** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.07)`): Base resting state for all cards and floating panels.
- **Glass Hover** (`box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 24px rgba(212, 175, 55, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.15)`): Interactive elevation lift on card hover.
- **Glass Inset** (`box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(0, 0, 0, 0.4)`): Recessed inputs, text areas, and search controls.

### Named Rules
**The No-Clay Rule.** Never apply heavy dual light/dark embossing or bevels. Surfaces must look like optical smoked glass, not carved clay.

**The Specular Edge Rule.** Every glass container must feature a hairline top specular highlight (`inset 0 1px 1px rgba(255, 255, 255, 0.08)`) simulating light hitting a polished chamfered bevel.

## Shapes

- **Event Cards & Containers**: Rounded rectangles with `20px` radius for cards and `24px` radius for full-screen modals.
- **Buttons & Controls**: `14px` border-radius with smooth quadratic bevels.
- **Chips & Badges**: Fully rounded pills (`border-radius: 9999px`).
- **Borders**: 1px crisp continuous hairline borders (`rgba(212, 175, 55, 0.18)` resting, brightening to `rgba(245, 215, 127, 0.45)` on hover).

## Components

### Buttons
- **Shape:** Rounded rectangle (`14px` radius, padding `0.85rem 1.8rem`).
- **Primary CTA (`.glass-btn-gold`):** Vibrant Aztec gold gradient (`linear-gradient(135deg, #FFF4D0 0%, #F5D77F 25%, #D4AF37 60%, #9A7B1C 100%)`), deep dark text (`#070709`), with gold bloom shadow (`0 6px 20px rgba(212, 175, 55, 0.35)`).
- **Secondary / Glass Button (`.glass-btn`):** Translucent glass fill (`rgba(18, 18, 27, 0.7)`), hairline border (`rgba(212, 175, 55, 0.25)`), `backdrop-filter: blur(12px)`. On hover, border brightens and text shines with `#F5D77F`.

### Cards / Containers (`.glass-card`)
- **Corner Style:** `20px` border-radius.
- **Background:** `rgba(18, 18, 27, 0.65)` with `backdrop-filter: blur(16px)`.
- **Border:** `1px solid rgba(212, 175, 55, 0.18)`.
- **Specular Highlight:** `inset 0 1px 1px rgba(255, 255, 255, 0.08)`.
- **Hover Behavior:** Translates `-4px` upward, border transitions to `rgba(245, 215, 127, 0.45)`, and emits an ambient gold aura.

### Inputs / Fields (`.glass-input`)
- **Style:** Frosted recessed glass (`rgba(10, 10, 16, 0.7)`), `12px` radius, `1px solid rgba(255, 255, 255, 0.06)`, `backdrop-filter: blur(10px)`.
- **Focus:** Border shifts to `rgba(212, 175, 55, 0.55)` with an ambient gold glow (`0 0 14px rgba(212, 175, 55, 0.22)`).

### Badges & Chips (`.glass-badge`)
- **Style:** Pill shape (`9999px` radius), translucent fill (`rgba(212, 175, 55, 0.1)` for gold, `rgba(16, 185, 129, 0.1)` for verified/active, `rgba(239, 68, 68, 0.1)` for closed/inactive).
- **Border:** `1px solid rgba(212, 175, 55, 0.28)`.

### Navigation Header
- **Style:** Fixed sticky bar with `rgba(9, 9, 14, 0.8)` background, `backdrop-filter: blur(20px)`, and a delicate lower hairline border (`1px solid rgba(212, 175, 55, 0.15)`).

## Do's and Don'ts

### Do:
- **Do** use `backdrop-filter: blur(16px)` on all floating cards, modals, and tooltips.
- **Do** combine `rgba(18, 18, 27, 0.65)` with an inner specular highlight (`inset 0 1px 1px rgba(255, 255, 255, 0.08)`).
- **Do** use the official title **Asthra 26** and preserve Cinzel for display moments.
- **Do** reserve the solid gold gradient button for the single primary conversion action per screen.
- **Do** maintain isolated routes: clean event gallery on `/`, gatekeeping desk on `/volunteer`.

### Don't:
- **Don't** use opaque solid black or gray backgrounds (`#12121b`, `#222`) for cards that block backdrop translucency.
- **Don't** use dual-axis clay neumorphic embossing shadows (`8px 8px 18px ... -8px -8px 18px`).
- **Don't** use loud neon or generic saturated colors (plain `#0000FF` or `#00FF00`); stick to tailored gold, emerald green, and crimson.
- **Don't** clutter the participant landing page with volunteer or administrative controls.
