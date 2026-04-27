# Minecraft Seed Finder

A comprehensive catalog of rare and legendary Minecraft seeds, featuring an intuitive search interface, procedural filters, and accurate seed visualization.

The fun part: this is also a JavaScript/TypeScript port of Minecraft seed generation logic inspired by Cubiomes. That makes it portable enough to search cool seeds directly in the browser with edition, version, biome, structure, and cluster filters, without needing a dedicated backend just to explore candidates.

![Minecraft Seed Finder](https://img.shields.io/badge/Minecraft-Seed%20Finder-green?style=for-the-badge)

## Features

- **Search & Filter** - Find seeds by name, category, version, edition, and confidence level
- **Procedural Search Lab** - Search for new seeds with biome, structure, and cluster-distance filters
- **7,953+ Seeds** - Curated database of verified and community-reported seeds
- **Browser Worldgen** - JavaScript/TypeScript seed-generation code runs client-side for portable seed discovery
- **Seed Explorer** - Quick links to Chunkbase for accurate biome and structure mapping
- **Responsive Design** - Works on desktop and mobile devices
- **Categories** - Speedrun seeds, rare biomes, structures, historic seeds, and more

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

### Cubiomes
This project incorporates algorithms and biome data from [Cubiomes](https://github.com/Cubitect/cubiomes), 
a C library that mimics Minecraft's biome generation.

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

### Other Credits
- **Chunkbase** - For providing accurate seed mapping tools
- **Minecraft@Home** - Community-distributed computing for seed discovery
- **r/minecraftseeds** - Community seed submissions

## License

This project is open source. The seed database is community-contributed.
Cubiomes integration is used under the MIT License.

## Deploy

Deploy easily with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/minecraft-seed-finder)
