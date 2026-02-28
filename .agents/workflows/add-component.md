---
description: Add a new shadcn/ui component to the project
---

# Add shadcn Component Workflow

// turbo-all

1. Check available components:
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && npx shadcn@latest add --help
```

2. Install the component:
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && npx shadcn@latest add <component-name>
```

3. Components are installed to `src/components/ui/<component-name>.tsx`

## Commonly Used Components
- `button`, `input`, `label`, `textarea`
- `card`, `badge`, `separator`
- `dialog`, `alert-dialog`, `sheet`
- `select`, `tabs`, `popover`
- `table`, `dropdown-menu`
- `calendar`, `date-picker`
- `toast` (already using sonner)

## Notes
- Import from `@/components/ui/<component>`
- All components support dark mode via CSS variables
