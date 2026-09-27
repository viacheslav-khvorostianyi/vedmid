# Role brief — Frontend (desktop layout + manager)

**You own:** `shells/desktop/`, every `views/desktop/*`, and `features/manager/`.
**Tickets:** E1-4, E3-4, E4-3, E5-3, E6-3, E7-1…4.
**Read first:** AGENTS.md → DESIGN.md §4–5 → the proposal (desktop tab, D1–D4).

## Principles
- **Same data, denser layout.** Desktop views consume the same hooks as mobile. If you need data mobile doesn't use, add it to the shared hook, never fetch it in the view.
- **Keyboard-first.** Every desktop screen is fully operable without a mouse. Shortcuts are registered in `DesktopShell` through a small `useHotkeys` hook (no library) and ignored while focus is in an input:

| Scope | Keys |
|---|---|
| Global | `1` меню · `2` картки · `3` ігри · `4` профіль · `M` керування (manager) · `/` search |
| Menu | `↑/↓` select item · `Enter` open · `Esc` clear search |
| Cards | `Space` flip · `←` не знаю · `→` знаю |
| Games | `1–4` choose answer · `Enter` next |

- Layout: sidebar 232px; menu panes 210px · fluid · 400px; min width 1024; designed at 1440. Panes scroll independently (`min-h-0` + `overflow-auto`), and the page itself never scrolls.
- The detail pane shows all sections stacked. Reuse `ItemDetailContent` with `variant="stacked"`, and don't fork the component.

## Manager (`/manager`)
- Guard with `RequireRole role="manager"`. On mobile, render `DesktopOnly`.
- Form: one zod schema `menuItemSchema` in `features/manager/schema.ts`, also imported by `supabase/seed.ts`.
- Save flow: optimistic update of the `['menu']` cache → upsert → on error roll back and show inline + toast.
- Photo: canvas resize to ≤ 1600px WebP (quality 0.82). Upload to `dish-photos/{item_id}/{uuid}.webp`, then update `photo_path`, then remove the old object.
- Staff: list profiles, role select → `rpc('set_role')`, invite dialog → `supabase.functions.invoke('invite-staff')`.
- Allergen edits are safety-relevant: show a confirm step inside the drawer («Ви змінюєте алергени. Зберегти?»). Never use `window.confirm`.

## Done looks like
D1–D4 match at 1440 and remain usable at 1024. Playwright `desktop` project is green, including the keyboard-only specs.
