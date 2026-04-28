## Issue

In light mode, the left sidebar shows only the "Creator" / "Admin" group labels faintly and the navigation items (Discover, Matches, Creators, etc.), the user profile name at the bottom, and most icons are invisible.

## Root cause

The shadcn `Sidebar` component (`src/components/ui/sidebar.tsx`) and `tailwind.config.ts` reference these CSS variables:

- `--sidebar-background`
- `--sidebar-foreground`
- `--sidebar-primary` / `--sidebar-primary-foreground`
- `--sidebar-accent` / `--sidebar-accent-foreground`
- `--sidebar-border`
- `--sidebar-ring`

None of these variables are defined in `src/index.css` (neither in `:root` nor in `.dark`). As a result, `bg-sidebar`, `text-sidebar-foreground`, `hover:bg-sidebar-accent`, etc. resolve to `hsl()` with no value — effectively transparent / unset. In light mode the page background is white, so white-on-white text disappears. Dark mode happens to look acceptable because the surrounding app is already dark.

## Fix

Add the `--sidebar-*` design tokens to both `:root` and `.dark` blocks in `src/index.css`, matching the existing purple/coral brand palette.

Light mode (`:root`):
- `--sidebar-background`: very light neutral (e.g. `260 20% 98%`)
- `--sidebar-foreground`: same dark text as `--foreground` (`260 10% 12%`)
- `--sidebar-primary`: brand purple
- `--sidebar-primary-foreground`: white
- `--sidebar-accent`: light purple tint for hover (e.g. `260 30% 94%`)
- `--sidebar-accent-foreground`: dark text
- `--sidebar-border`: matches `--border`
- `--sidebar-ring`: brand purple

Dark mode (`.dark`):
- `--sidebar-background`: slightly elevated dark (e.g. `260 22% 10%`)
- `--sidebar-foreground`: near-white
- `--sidebar-primary`: brighter purple
- `--sidebar-accent`: subtle dark hover (e.g. `260 20% 18%`)
- `--sidebar-border`: matches dark `--border`
- etc.

No component changes are required — only `src/index.css` is edited.

## Verification

After the change:
- Light mode: sidebar background is a soft off-white, all nav labels (Discover, Matches, Creators, Achievements, Referrals, Profile) and group headings (Creator, Admin) are clearly readable; hover states show a light purple tint.
- Dark mode: sidebar still looks correct, slightly distinct from the main background.
- The user's profile name "Rafik Bekov" and "View Profile" subtitle at the bottom of the sidebar are visible in both themes.
