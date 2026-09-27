# Role brief — QA (automation + UX)

**You own:** the Playwright suite, the a11y checks, test data fixtures and the release checklist.
**Tickets:** E0-2 (Playwright setup, with FM), E8-5, and review of every PR that touches `views/`.
**Read first:** AGENTS.md → DESIGN.md → BACKLOG acceptance criteria.

## Test pyramid
| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | engines (quiz, match, recipe, guest), `leitner.ts`, `rank.ts`, `useMenuSearch`, `offlineQueue`, mappers |
| Component | Vitest + Testing Library | `ui/*` states, Flashcard flip/swipe, SegmentedTabs, manager form validation |
| DB | pgTAP (`supabase test db`) | RLS allow/deny, RPC behaviour (owned by BE, reviewed by QA) |
| E2E | Playwright | user journeys in **both** projects |
| A11y | `@axe-core/playwright` | every route, both projects |

## Playwright config
```ts
projects: [
  { name: 'mobile',  use: { ...devices['Pixel 7'] } },
  { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
]
```
The backend in E2E is either the local Supabase stack (`supabase start` + `db:seed`, preferred in CI) or MSW mocks for fast PR runs. Test users are `waiter@test.local` and `manager@test.local`, logged in via `auth.admin.generateLink` in global setup and saved to `storageState`.

## Required E2E journeys
1. **Login:** unknown email shows the error copy; a known email shows the success panel; the magic link lands on the requested route.
2. **Menu browse:** chip «вино» shows wine subcategories; opening an item shows the correct allergens; back restores scroll and chip.
3. **Search:** «лактоза» returns only items whose allergens include lactose; an empty result shows «нічого не знайдено».
4. **Flashcards:** «знаю» increments the counter and XP; reloading keeps progress (server); offline answer → online → XP updated.
5. **Games:** quiz to the end shows a results screen, and a `game_results` row exists.
6. **Profile:** XP, level and achievements reflect the previous journeys.
7. **Manager (desktop):** edit an item's sales phrase → a waiter sees it after refresh; photo upload shows the image; a waiter gets 403/redirect on `/manager`.
8. **Layout switch:** resizing 1440 → 800 swaps to MobileShell and keeps the current route.
9. **Keyboard (desktop):** complete the menu → detail → cards flow with the keyboard only.

## UX checks per PR (manual, 5 min)
- Compare against the proposal at 390px and 1440px; attach screenshots.
- Touch targets ≥ 44px (DevTools), focus ring visible, reduced motion respected.
- Ukrainian copy: lowercase, no English leftovers, errors actionable.
- Check the long-title case (the longest wine title, «Grand Admiral Brut Natur Rose (Виноробня 46parallel, Південний регіон)»): no clipping in cards, detail or flashcard.

## Release gate (E8-5)
All journeys are green in both projects; axe finds no serious/critical issues; Lighthouse mobile ≥ 90 perf & a11y on `/menu`; no console errors; the allergen sign-off (E8-6) is attached.
