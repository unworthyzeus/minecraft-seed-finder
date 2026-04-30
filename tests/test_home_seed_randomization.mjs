import { strict as assert } from 'assert';

import {
  PINNED_HOME_SEED_ID,
  isDefaultHomeSeedView,
  randomizeHomeSeeds,
} from '../lib/home-randomization.js';

const seeds = [
  { id: 'alpha', seed: '1' },
  { id: PINNED_HOME_SEED_ID, seed: '3257840388504953787' },
  { id: 'beta', seed: '2' },
  { id: 'gamma', seed: '3' },
  { id: 'delta', seed: '4' },
];

const randomizedA = randomizeHomeSeeds(seeds, 12345);
const randomizedB = randomizeHomeSeeds(seeds, 67890);

assert.equal(
  randomizedA[0].id,
  PINNED_HOME_SEED_ID,
  'The Pack.png World should stay pinned first on the default home view'
);

assert.deepEqual(
  seeds.map(seed => seed.id),
  ['alpha', PINNED_HOME_SEED_ID, 'beta', 'gamma', 'delta'],
  'Home randomization should not mutate the source seed list'
);

assert.notDeepEqual(
  randomizedA.slice(1).map(seed => seed.id),
  randomizedB.slice(1).map(seed => seed.id),
  'Different page-load shuffle seeds should change the rest of the home seed order'
);

assert.equal(
  isDefaultHomeSeedView(),
  true,
  'Default home filters should enable randomization'
);

assert.equal(
  isDefaultHomeSeedView({ searchQuery: 'village' }),
  false,
  'Search results should keep their explicit ordering instead of being randomized'
);

assert.equal(
  isDefaultHomeSeedView({ sortBy: 'rarity' }),
  false,
  'Explicit sort modes should not be randomized'
);

console.log('Home seed randomization keeps The Pack.png World pinned and shuffles the rest');
