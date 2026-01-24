#include "generator.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// Simple LCG for deterministic 64-bit random numbers (consistency across runs
// if needed)
static uint64_t lcg_state = 0;
void seed_lcg(uint64_t seed) { lcg_state = seed; }
uint64_t next_lcg() {
  lcg_state = lcg_state * 6364136223846793005ULL + 1442695040888963407ULL;
  return lcg_state;
}

int main() {
  // Versions descending from 1.17 to 1.0 (B1.8/B1.7 can be added if needed, but
  // request said 1.17->1.0) Actually typically 1.0 is MC_1_0 (12). 1.17 is
  // MC_1_17 (30).
  int versions[] = {MC_1_17, MC_1_16, MC_1_15, MC_1_14, MC_1_13, MC_1_12,
                    MC_1_11, MC_1_10, MC_1_9,  MC_1_8,  MC_1_7,  MC_1_6,
                    MC_1_5,  MC_1_4,  MC_1_3,  MC_1_2,  MC_1_1,  MC_1_0};
  int count = sizeof(versions) / sizeof(int);

  // Seed LCG for reproducibility of test set
  seed_lcg(987654321ULL);

  for (int v = 0; v < count; v++) {
    int mc = versions[v];

    // Generate 100 test cases per version with "really random" coords
    for (int i = 0; i < 100; i++) {
      uint64_t next = next_lcg();
      int64_t seed = (int64_t)next; // Use full 64-bit space for seed

      // Random coords in range +/- 10,000,000
      uint64_t r1 = next_lcg();
      int x = (int)((r1 % 20000000) - 10000000);
      uint64_t r2 = next_lcg();
      int z = (int)((r2 % 20000000) - 10000000);

      Generator g;
      setupGenerator(&g, mc, 0);
      applySeed(&g, DIM_OVERWORLD, seed);

      // Get biome at (x, z) at scale 4 (standard biome gen scale)
      int biomeID = getBiomeAt(&g, 4, x, 0, z);

      // Output format: Version Seed X Z ExpectedID
      printf("%d %lld %d %d %d\n", mc, (long long)seed, x, z, biomeID);
    }
  }
  return 0;
}
