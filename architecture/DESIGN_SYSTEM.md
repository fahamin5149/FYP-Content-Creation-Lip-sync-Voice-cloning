# Design System Documentation

## Overview
This design system is built for a modern SaaS landing page with a dark theme aesthetic, featuring sophisticated animations and interactive elements. The system emphasizes visual hierarchy, smooth transitions, and engaging user interactions.

## Color Palette

### Primary Colors
- **Primary**: `oklch(0.7214 0.1337 49.9802)` - Orange accent color (#e78a53)
- **Primary Foreground**: `oklch(0.1797 0.0043 308.1928)` - Dark text on primary
- **Secondary**: `oklch(0.594 0.0443 196.0233)` - Blue accent
- **Secondary Foreground**: `oklch(0.1797 0.0043 308.1928)` - Dark text on secondary

### Background Colors
- **Background**: `oklch(0.1797 0.0043 308.1928)` - Main dark background (#121113)
- **Card**: `oklch(0.1822 0 0)` - Slightly lighter card background
- **Muted**: `oklch(0.252 0 0)` - Muted background elements
- **Accent**: `oklch(0.3211 0 0)` - Accent background

### Text Colors
- **Foreground**: `oklch(0.8109 0 0)` - Primary text color (light)
- **Muted Foreground**: `oklch(0.6268 0 0)` - Secondary text color
- **Card Foreground**: `oklch(0.8109 0 0)` - Text on cards

### Border & Interactive
- **Border**: `oklch(0.252 0 0)` - Default border color
- **Ring**: `oklch(0.7214 0.1337 49.9802)` - Focus ring (primary color)

## Typography

### Font Families
- **Primary**: Geist Sans - Clean, modern sans-serif for body text
- **Monospace**: Geist Mono - For code and technical content
- **Serif**: System serif fallback

### Font Sizes & Hierarchy
- **Hero Title**: `text-4xl sm:text-6xl lg:text-7xl` (64px-112px)
- **Section Headers**: `text-4xl md:text-[54px]` with `md:leading-[60px]`
- **Feature Titles**: `text-2xl` (32px)
- **Body Text**: `text-lg` (18px) for descriptions, `text-sm` (14px) for secondary
- **Button Text**: `text-sm` (14px) with `font-medium` or `font-bold`

### Font Weights
- **Bold**: `font-bold` for CTAs and emphasis
- **Semibold**: `font-semibold` for headings
- **Medium**: `font-medium` for navigation and buttons
- **Normal**: Default weight for body text

### Text Styling
- **Tracking**: `tracking-tight` for large headings, `tracking-tighter` for hero text
- **Leading**: `leading-none` for tight headings, `leading-relaxed` for body text
- **Text Balance**: Use `text-balance` for optimal line breaks on titles

## Layout Structure

### Container System
- **Main Container**: `container mx-auto px-4` - Responsive centered container
- **Max Widths**: 
  - Hero content: `max-w-4xl`
  - Text content: `max-w-2xl`
  - Feature descriptions: `max-w-[460px]`

### Grid System
- **Feature Grid**: `grid grid-cols-12 gap-4`
- **Responsive Columns**: 
  - Mobile: `col-span-12`
  - Tablet: `md:col-span-6`
  - Desktop: `xl:col-span-6`

### Spacing Scale
- **Section Padding**: `py-12 sm:py-24 md:py-32`
- **Component Gaps**: `gap-4`, `gap-6`, `gap-8`, `gap-12`
- **Card Padding**: `p-6`
- **Button Padding**: `px-4 py-2` (small), `px-6 py-3` (large)

### Layout Method Priority
1. **Flexbox**: Primary layout method (`flex`, `items-center`, `justify-between`)
2. **CSS Grid**: For complex 2D layouts (`grid`, `grid-cols-12`)
3. **Absolute Positioning**: Only for overlays and decorative elements

## Component Styles

### Cards
\`\`\`css
/* Base Card Style */
.card {
  @apply border-secondary/40 text-card-foreground relative overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out;
}

/* Hover Effects */
.card:hover {
  transform: scale(1.02);
  border-color: rgba(231, 138, 83, 0.6);
  box-shadow: 0 0 30px rgba(231, 138, 83, 0.2);
}
\`\`\`

### Buttons
\`\`\`css
/* Primary Button */
.btn-primary {
  @apply rounded-md font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm;
}

/* Secondary Button */
.btn-secondary {
  @apply font-medium transition-colors hover:text-foreground text-muted-foreground text-sm cursor-pointer;
}
\`\`\`

### Navigation
\`\`\`css
/* Header */
.header {
  @apply sticky top-4 z-[9999] mx-auto w-full flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300;
}

/* Navigation Links */
.nav-link {
  @apply relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer;
}
\`\`\`

### Badges
\`\`\`css
.badge {
  @apply inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full;
}

.badge-secondary {
  @apply bg-secondary/20 text-secondary-foreground border border-secondary/30;
}
\`\`\`

## Animations & Interactions

### Hover Effects
- **Scale**: `hover:scale-105` for small elements, `scale: 1.02` for cards
- **Translate**: `hover:-translate-y-0.5` for buttons
- **Color Transitions**: `transition-colors` for text and background changes
- **Shadow**: `hover:shadow-lg` or custom shadow with primary color glow

### Motion Animations (Framer Motion)
\`\`\`javascript
// Fade in from bottom
const fadeInUp = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0 }
}

// Stagger children animations
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}
\`\`\`

### Custom Animations
- **Marquee**: For testimonials and scrolling content
- **Shiny Text**: Gradient animation for special text effects
- **Scramble Hover**: Text scrambling effect for interactive elements

## Shadows & Effects

### Shadow Scale
- **Small**: `shadow-sm` - Subtle card shadows
- **Medium**: `shadow-lg` - Standard component shadows
- **Large**: `shadow-xl` - Prominent element shadows
- **Custom**: `shadow-[0_0_30px_rgba(231,138,83,0.2)]` - Primary color glow

### Backdrop Effects
- **Blur**: `backdrop-blur-sm` for glass morphism
- **Opacity**: `bg-background/80` for semi-transparent overlays

### Gradients
- **Primary Button**: `bg-gradient-to-b from-primary to-primary/80`
- **Text Gradients**: `bg-gradient-to-b from-zinc-800 to-zinc-700 bg-clip-text text-transparent`
- **Radial Backgrounds**: `bg-radial from-primary/50 to-primary/0`

## Responsive Design

### Breakpoints
- **Mobile**: Default (< 768px)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)
- **Large**: `xl:` (1280px+)

### Responsive Patterns
- **Typography**: Scale up font sizes on larger screens
- **Spacing**: Increase padding/margins on larger screens
- **Grid**: Adjust column spans based on screen size
- **Navigation**: Transform to mobile menu on small screens

## Accessibility

### Contrast Requirements
- Ensure minimum 4.5:1 contrast ratio for normal text
- Use semantic color tokens (`text-foreground`, `bg-background`)
- Provide focus indicators with `ring` utilities

### Interactive Elements
- Use proper ARIA labels and roles
- Ensure keyboard navigation support
- Provide hover and focus states for all interactive elements

## Usage Guidelines

### When Creating New Pages
1. **Start with the layout structure**: Use container, proper spacing, and grid system
2. **Apply typography hierarchy**: Use established font sizes and weights
3. **Use semantic color tokens**: Prefer `text-foreground` over hardcoded colors
4. **Add consistent animations**: Use established motion patterns
5. **Maintain spacing consistency**: Follow the spacing scale
6. **Test responsiveness**: Ensure proper behavior across breakpoints

### Component Consistency
- All cards should use the same border, shadow, and hover effects
- Buttons should follow the established primary/secondary patterns
- Navigation elements should maintain consistent spacing and typography
- Form elements should use consistent styling and focus states

This design system ensures visual consistency and provides a solid foundation for scaling the application while maintaining the sophisticated, modern aesthetic established in the landing page.
