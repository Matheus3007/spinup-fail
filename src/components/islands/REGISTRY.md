# Island registry

This file is the contract between the `obsidian-import` skill and the React
components in this folder. The skill reads it to decide:

- Whether an existing component matches an `island request` block in a note.
- What an existing component is named, where it lives, and what props it takes.
- Where to append a new entry after generating a component.

Add new entries below in the same format. Keep "When to use" sentences concrete —
they are the matcher.

---

## BeaterEnergyChart
- **File:** `BeaterEnergyChart.tsx`
- **When to use:** Post compares rotational kinetic energy of two beater bars across an RPM sweep.
- **Props:** none (self-contained, defaults to a 3" vs 5" comparison; user can edit mass/length inline).
- **Example:** `<BeaterEnergyChart client:visible />`

## Callout
- **File:** `Callout.tsx`
- **When to use:** Any aside the author flagged with an Obsidian `> [!note]` / `[!warning]` / `[!fail]` / `[!win]` callout.
- **Props:** `{ tone?: 'note' | 'warn' | 'fail' | 'win', title?: string, children }`
- **Example:** `<Callout tone="fail" title="bring-up">magic smoke escaped at 6S</Callout>`
