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

Bedrock is a different accuracy track. The app has Bedrock seed normalization, parity-era biome rendering, and MCBE-style structure placement for villages, temples, monuments, mansions, outposts, shipwrecks, ocean ruins, buried treasure, and ruined portals. Those Bedrock structures are still labeled as candidates: final proof should come from Minecraft Bedrock itself, Bedrock Dedicated Server, or `/locate`-based fixtures. Bedrock structures without a dedicated rule use a lower-confidence Java/parity fallback.

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

### Bedrock Structure Reference
Bedrock structure placement constants and RNG behavior are cross-checked against [bedrock-dev/MCBEStructureFinder](https://github.com/bedrock-dev/MCBEStructureFinder), an MIT-licensed Minecraft Bedrock Edition structure finder. This is not a substitute for Bedrock Dedicated Server or in-game ground truth, so Bedrock results stay candidate-labeled in the UI.

### Community Data
Community seed submissions are collected from public seed-sharing communities and direct submissions. Entries are best-effort catalog records and should be tested in the target Minecraft version before relying on them.

## License

This project is open source under the [Apache License 2.0](./LICENSE). Redistributors must preserve the copyright and attribution notices in [NOTICE](./NOTICE).

Cubiomes-derived portions remain credited to Cubitect under the MIT License, as recorded in the NOTICE file.

## Deploy

Deploy easily with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/minecraft-seed-finder)
