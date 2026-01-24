#include "generator.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

// Simple LCG for deterministic 64-bit random numbers
static uint64_t lcg_state = 0;
void seed_lcg(uint64_t seed) { lcg_state = seed; }
uint64_t next_lcg() {
  lcg_state = lcg_state * 6364136223846793005ULL + 1442695040888963407ULL;
  return lcg_state;
}

int main() {
  // Versions from Beta 1.7 to 1.17
  int versions[] = {MC_B1_7,   MC_B1_8, MC_1_0,  MC_1_1,  MC_1_2,  MC_1_3,
                    MC_1_4,    MC_1_5,  MC_1_6,  MC_1_7,  MC_1_8,  MC_1_9,
                    MC_1_10,   MC_1_11, MC_1_12, MC_1_13, MC_1_14, MC_1_15,
                    MC_1_16_1, MC_1_16, MC_1_17};
  int count = sizeof(versions) / sizeof(int);

  // Seed LCG for reproducibility
  seed_lcg(123456789ULL);

  for (int v = 0; v < count; v++) {
    int mc = versions[v];

    // Generate 5000 test cases per version
    for (int i = 0; i < 5000; i++) {
      uint64_t next = next_lcg();
      int64_t seed = (int64_t)next;

      Generator g;
      setupGenerator(&g, mc, 0);
      applySeed(&g, DIM_OVERWORLD, seed);

      // Test at origin (0, 0) and far coord (5000, 5000) - using scale 4
      int biomeOrigin = getBiomeAt(&g, 4, 0, 0, 0);
      int biomeFar = getBiomeAt(&g, 4, 5000, 0, 5000);

      // Output format: Version Seed BiomeOrigin BiomeFar
      printf("%d %lld %d %d\n", mc, (long long)seed, biomeOrigin, biomeFar);
    }
  }
  return 0;
}
