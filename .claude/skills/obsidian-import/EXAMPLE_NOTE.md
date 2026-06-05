---
type: post
title: "Beater bars and how much they actually hit"
summary: "Why a 5\" beater stores ~2.7× more energy than a 3\" one at the same RPM."
publishedAt: 2026-06-01
project: Spinup
tags: [combat-robotics, weapons, energy]
---

The first version of [[Spinup MOC|Spinup]]'s weapon was a 3" steel beater.

> [!fail] lesson 1
> Picking weapon length by what *fits* is how you end up bumping opponents
> instead of cutting them.

Here's the energy comparison:

```island request
Compare rotational kinetic energy of two beater bars across RPM.
Inputs: bar length (inches) and bar mass (grams), independently editable for each bar.
Defaults: 3" / 200g and 5" / 200g.
RPM range: 0 to 8000 in steps of 200.
Show energy in joules. Add a reference line at 50J labeled "pit damage threshold".
```

![[spinup-prototype.jpg]]

#combat-robotics #weapons
