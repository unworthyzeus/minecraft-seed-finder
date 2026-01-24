#include "generator.h"
#include <stdint.h>
#include <stdio.h>

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
  // Beta versions only
  int versions[] = {MC_B1_7, MC_B1_8};
  int count = 2;

  // Seed LCG for reproducibility
  seed_lcg(0xBE7A12345678ULL);

  // 5000 test cases per version = 10,000 total
  int tests_per_version = 5000;

  for (int v = 0; v < count; v++) {
    int mc = versions[v];

    for (int i = 0; i < tests_per_version; i++) {
      // Random seed
      uint64_t next = next_lcg();
      int64_t seed = (int64_t)next;

      // Random coordinates - varying ranges for diversity
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
        range = 2000000;
        break; // Very far
      case 4:
        range = 5000000;
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
