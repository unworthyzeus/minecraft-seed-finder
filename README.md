# Minecraft Seed Finder

A comprehensive catalog of rare and legendary Minecraft seeds, featuring an intuitive search interface, procedural filters, and accurate seed visualization.

The fun part: this is also a JavaScript/TypeScript port of Minecraft seed generation logic inspired by Cubiomes. That makes it portable enough to search cool seeds directly in the browser with edition, version, biome, structure, and cluster filters, without needing a dedicated backend just to explore candidates.

![Minecraft Seed Finder](https://img.shields.io/badge/Minecraft-Seed%20Finder-green?style=for-the-badge)

## Features

- **Search & Filter** - Find seeds by name, category, version, edition, and confidence level
- **Procedural Search Lab** - Search for new seeds with biome, structure, and cluster-distance filters
- **7,953+ Seeds** - Curated database of verified and community-reported seeds
- **Browser Worldgen** - JavaScript/TypeScript seed-generation code runs client-side for portable seed discovery
- **Seed Visualizer** - In-browser biome and structure previews for seed inspection
- **Responsive Design** - Works on desktop and mobile devices
- **Categories** - Speedrun seeds, rare biomes, structures, historic seeds, and more

## Accuracy Scope

Java worldgen is treated as a Cubiomes port. The strict local GT test `npm run test:java:cubiomes` compares sampled Java B1.8 through 1.21 biome output against Cubiomes' `ground_truth.txt` when `../cubiomes-original/ground_truth.txt` or `CUBIOMES_GT_FILE` is available, and also checks Java structure placement against the bundled Cubiomes structure fixture. Beta 1.7 is intentionally not included in that strict pass yet because its older sea-level/noise path still needs separate parity work.

Bedrock is a different accuracy track. The app now uses a JavaScript port/adaptation of [FragrantResult186/cubiomes-bedrock](https://github.com/FragrantResult186/cubiomes-bedrock) for modern Bedrock biome decision trees and dedicated Bedrock structure candidates including villages, temples, monuments, mansions, outposts, shipwrecks, ocean ruins, buried treasure, ruined portals, ancient cities, trail ruins, and trial chambers. These are still labeled as candidates unless a Bedrock Dedicated Server verifier confirms them: final proof should come from Minecraft Bedrock itself, BDS, or `/locate`-based fixtures.

The Bedrock Search Lab therefore has two stages. The browser performs a fast cubiomes-bedrock JS prefilter. It probes `/api/bedrock/verify` with a cheap status request first; survivor seeds are POST-checked only when the route reports that a local/self-hosted BDS verifier is available. If `BEDROCK_BDS_ROOT` or `BDS_ROOT` points at a Bedrock Dedicated Server folder, `/api/bedrock/verify` can launch BDS, run `/locate`, and promote surviving Bedrock results to `BDS confirmed`. This verifier is intentionally optional and is not expected to run inside Vercel serverless deployments.

Known Bedrock version gap: cubiomes-bedrock has grouped profiles rather than one exact generator for every selectable patch. Bedrock `1.21.50` and `1.21.60` use the Wild Drop tree, and `26.x` currently maps to the nearest `26.2/26.20` cubiomes-bedrock profile unless an exact profile is added later. The UI and README keep those mapped versions candidate-labeled.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 13.5 (App Router)
- **Styling**: CSS with modern design patterns
- **Font**: [Geist](https://vercel.com/font) by Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Optional Bedrock Dedicated Server verifier

The Bedrock verifier is disabled by default. To enable local/self-hosted BDS checks, download Bedrock Dedicated Server from Mojang, extract it, and point the app at that folder:

```bash
BEDROCK_BDS_ROOT=C:\path\to\bedrock-server
# or
BDS_ROOT=C:\path\to\bedrock-server
```

When configured, the Search Lab calls `/api/bedrock/verify` only for Bedrock seeds that already survived the fast JS prefilter. When not configured, the UI keeps those results as Bedrock candidates and skips the survivor POST calls. The API creates a temporary BDS world for that seed, runs `/locate biome` and `/locate structure`, and marks the result `BDS confirmed` only if the requested radius and cluster constraints match.

## Credits & Acknowledgments

This project is mildly inspired by the wider Minecraft seed-hunting and mapping community. It is built as its own browser-first version of that idea: a portable seed catalog and procedural search lab with JavaScript/TypeScript world generation.

### Cubiomes
This project ports and adapts algorithms and biome data from [Cubiomes](https://github.com/Cubitect/cubiomes), a C library that mimics Minecraft's biome generation.

```
MIT License
Copyright (c) 2020 Cubitect

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

### Cubiomes-Bedrock
Modern Bedrock biome trees and structure profiles are ported/adapted from [FragrantResult186/cubiomes-bedrock](https://github.com/FragrantResult186/cubiomes-bedrock), an MIT-licensed fork of Cubiomes.

### Bedrock Structure Reference
Earlier Bedrock structure placement constants and RNG behavior were cross-checked against [bedrock-dev/MCBEStructureFinder](https://github.com/bedrock-dev/MCBEStructureFinder), an MIT-licensed Minecraft Bedrock Edition structure finder. This is not a substitute for Bedrock Dedicated Server or in-game ground truth, so Bedrock results stay candidate-labeled in the UI unless BDS confirms them.

### Community Data
Community seed submissions are collected from public seed-sharing communities and direct submissions. Entries are best-effort catalog records and should be tested in the target Minecraft version before relying on them.

## License

This project is open source under the [Apache License 2.0](./LICENSE). Redistributors must preserve the copyright and attribution notices in [NOTICE](./NOTICE).

Cubiomes-derived and cubiomes-bedrock-derived portions remain credited to their upstream MIT-licensed projects, as recorded in the NOTICE file.

## Deploy

Deploy easily with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/minecraft-seed-finder)
