#include "generator.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

int main() {
  int versions[] = {MC_B1_7, MC_B1_8};
  int nv = 2;

  fprintf(stderr, "Opening seeds.txt...\n");
  FILE *fseeds = fopen("seeds.txt", "r");
  if (!fseeds) {
    fprintf(stderr, "Could not open seeds.txt\n");
    return 1;
  }

  long long seeds[1000];
  int seed_count = 0;
  while (seed_count < 1000 && fscanf(fseeds, "%lld", &seeds[seed_count]) == 1) {
    seed_count++;
  }
  fclose(fseeds);
  fprintf(stderr, "Read %d seeds.\n", seed_count);

  int coords[][2] = {
      {0, 0}, {100, 100}, {-100, -100}, {5000, 5000}, {-5000, -5000}};
  int nc = 5;

  Generator g;
  for (int v = 0; v < nv; v++) {
    fprintf(stderr, "Processing version %d...\n", versions[v]);
    setupGenerator(&g, versions[v], 0);
    for (int i = 0; i < seed_count; i++) {
      applySeed(&g, DIM_OVERWORLD, (uint64_t)seeds[i]);
      for (int c = 0; c < nc; c++) {
        int b = getBiomeAt(&g, 1, coords[c][0], 64, coords[c][1]);
        printf("%d %lld %d %d %d\n", versions[v], seeds[i], coords[c][0],
               coords[c][1], b);
      }
      if (i % 100 == 0)
        fflush(stdout);
    }
  }

  fprintf(stderr, "Done.\n");
  return 0;
}
