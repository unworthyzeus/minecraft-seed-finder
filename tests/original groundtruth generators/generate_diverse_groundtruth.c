#include "generator.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

// Simple LCG for deterministic random numbers
static uint64_t lcg_state = 0;
void seed_lcg(uint64_t seed) { lcg_state = seed; }
uint64_t next_lcg() {
  lcg_state = lcg_state * 6364136223846793005ULL + 1442695040888963407ULL;
  return lcg_state;
}

// Generate random coordinate in range [-max, max]
int random_coord(int max) {
  uint64_t r = next_lcg();
  return (int)((r % (2 * (uint64_t)max + 1)) - max);
}

int main() {
  // Non-beta versions only: MC 1.0 (3) through MC 1.17 (21)
  int versions[] = {MC_1_0,  MC_1_1,    MC_1_2,  MC_1_3,  MC_1_4,
                    MC_1_5,  MC_1_6,    MC_1_7,  MC_1_8,  MC_1_9,
                    MC_1_10, MC_1_11,   MC_1_12, MC_1_13, MC_1_14,
                    MC_1_15, MC_1_16_1, MC_1_16, MC_1_17};
  int count = sizeof(versions) / sizeof(int);

  // Seed LCG for reproducibility
  seed_lcg(0xDEADBEEF12345678ULL);

  // ~5263 test cases per version = ~100,000 total
  int tests_per_version = 5263;

  for (int v = 0; v < count; v++) {
    int mc = versions[v];

    for (int i = 0; i < tests_per_version; i++) {
      // Random seed
      uint64_t next = next_lcg();
      int64_t seed = (int64_t)next;

      // Random coordinates - varying ranges for diversity
      // Mix of near, medium, far, and very far coordinates
      int range;
      int range_type = i % 5;
      switch (range_type) {
      case 0:
        range = 1000;
        break; // Near
      case 1:
        range = 50000;
        break; // Medium
      case 2:
        range = 500000;
        break; // Far
      case 3:
        range = 5000000;
        break; // Very far
      case 4:
        range = 10000000;
        break; // Extreme
      }

      int x = random_coord(range);
      int z = random_coord(range);

      Generator g;
      setupGenerator(&g, mc, 0);
      applySeed(&g, DIM_OVERWORLD, seed);

      // Get biome at (x, z) at scale 4
      int biomeID = getBiomeAt(&g, 4, x, 0, z);

      // Output format: Version Seed X Z BiomeID
      printf("%d %lld %d %d %d\n", mc, (long long)seed, x, z, biomeID);
    }
  }
  return 0;
}
