---
name: update
description: Publish a dev-journal update in the author's own words, verbatim, with frontmatter and optional media (renders, photos). One confirmation line showing the exact text, then commit + push to main. Use for /update, "post an update", "journal: …".
---

# /update: the author's words, exactly

Updates are **not written by Claude**. Whatever text the author sends is
published exactly as written: no rewording, no typo fixes, no punctuation or
capitalization changes, no added sentences, no translation (unless the author
asks for one, in which case the translation is a *separate* update or is
appended below the original, as they say).

Claude only adds metadata and attaches media.

**Site URL.** The blog is served from the GitHub Pages custom domain, which
is currently `blog.spinup.fail` (the apex `spinup.fail` is a registrar
placeholder). If URLs stop resolving, check the real one with
`gh api repos/Matheus3007/spinup-fail/pages -q .cname` and use that.

## Parse the message

`/update [project=<P>] [mood=<m>] [tags=a,b] [title="…"] [media=<path>[,<path>]] <text>`

The author may also say these things in plain words around the text ("for
ReBot, mood win, attach the render at …"). Separate *instructions to you* from
*the text to publish*. If the boundary is unclear, ask in one line rather than
guess: publishing an instruction as journal text, or dropping a sentence, are
both failures.

- **project** (required): use what the author said. Otherwise, if the text
  clearly names one existing project (see `project:` values in
  `src/content/posts/` and `src/content/updates/`), use it; else ask.
- **mood**: one of `win | loss | progress | stuck | idea`, only if the author
  gave one or it is unmistakable from the text. Otherwise omit.
- **tags**: only if given, or one or two obvious ones from existing tags.
- **title**: only if the author gave one. Never write a title for them: the
  list falls back to "<project> · <date>".
- **media**: paths the author points to, e.g.
  `/mnt/c/Users/mathe/eitri/projects/<proj>/...` or
  `/mnt/c/Users/mathe/pcb-lab/boards/<board>/build/renders/...`. If they say
  "the latest render", pick the newest matching file (`ls -t`) and name it in
  the confirmation. Images are appended after the text.

## Write it (mechanically)

Save the text exactly as received to a temp file in the scratchpad (use the
Write tool with the literal text; no trailing additions), then:

```sh
node scripts/new-update.mjs --project "<P>" --text-file <tmp> \
  [--mood <m>] [--tags a,b] [--title "<t>"] [--media <p1>,<p2>]
```

It writes `src/content/updates/<date>-<project>.md` (plain Markdown, not MDX,
so `<`, `{` and friends are safe), copies media to
`public/media/updates/<id>/`, and prints `verbatim: ok`. Anything else → stop
and report.

Line breaks are preserved on the page (`.update-body p { white-space: pre-line }`).
Markdown syntax the author typed (`*`, `#`, links) renders as Markdown; that is
what they wrote.

## Confirm (one message), then publish

Show exactly this and wait for a yes:

```
update → <project> · <date>[ · <mood>][ · media: <files>]
"""
<the exact text>
"""
publish? (y / change …)
```

On yes:

```sh
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run build
git add src/content/updates public/media/updates
git commit -m "update: <project> <date>"
git push origin main
gh run watch --exit-status $(gh run list -L1 --json databaseId -q '.[0].databaseId')
```

Reply: `live: https://blog.spinup.fail/updates/<id>`.

If the author says "change …": a change to metadata or media → redo it. A
change to the text → use their new text verbatim (they edit, you don't).
On "no"/"cancel": delete the file and copied media, nothing is committed.

## Never

- Publish an update the author didn't send in this conversation.
- "Improve" the text, even an obvious typo. If you think something is a
  mistake (e.g. a sentence looks cut off), mention it in the confirmation
  line and let them decide.
- Add any Claude attribution to updates.

## Testing the flow

Use `--draft`: the file gets `draft: true`, is kept out of lists and is
previewed at `/drafts/updates/<id>`. Delete it (and its media) afterwards.

## Gotcha: deleted entries linger locally

Astro's content cache (`node_modules/.astro/data-store.json`) can keep an
entry after its file is deleted when the collection folder ends up empty. CI
builds from scratch, so the live site is unaffected; locally, after deleting
an entry, `rm node_modules/.astro/data-store.json` before rebuilding.
