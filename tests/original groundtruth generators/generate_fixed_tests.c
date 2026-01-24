#include "generator.h"
#include <stdint.h>
#include <stdio.h>

int main() {
  // Fixed test seeds
  int64_t seeds[] = {0,
                     1,
                     12345,
                     -1,
                     123456789012345LL,
                     -987654321LL,
                     1234567890123456789LL,
                     -1234567890123456789LL,
                     42,
                     999999999999LL};
  int numSeeds = sizeof(seeds) / sizeof(seeds[0]);

  // Fixed coordinates to test
  int coords[][2] = {
      {0, 0}, {100, 100}, {-100, -100}, {5000, 5000}, {-5000, -5000}};
  int numCoords = sizeof(coords) / sizeof(coords[0]);

  // Versions from 1.17 down to 1.0
  int versions[] = {MC_1_17, MC_1_16, MC_1_15, MC_1_14, MC_1_13, MC_1_12,
                    MC_1_11, MC_1_10, MC_1_9,  MC_1_8,  MC_1_7,  MC_1_6,
                    MC_1_5,  MC_1_4,  MC_1_3,  MC_1_2,  MC_1_1,  MC_1_0};
  int numVersions = sizeof(versions) / sizeof(versions[0]);

  for (int v = 0; v < numVersions; v++) {
    int mc = versions[v];
    for (int s = 0; s < numSeeds; s++) {
      int64_t seed = seeds[s];

      Generator g;
      setupGenerator(&g, mc, 0);
      applySeed(&g, DIM_OVERWORLD, seed);

      for (int c = 0; c < numCoords; c++) {
        int x = coords[c][0];
        int z = coords[c][1];

        // Get biome at scale 4 (biome coordinates)
        int biomeID = getBiomeAt(&g, 4, x, 0, z);

        // Output: Version Seed X Z BiomeID
        printf("%d %lld %d %d %d\n", mc, (long long)seed, x, z, biomeID);
      }
    }
  }
  return 0;
}
