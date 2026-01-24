#include "generator.h"
#include <stdio.h>
#include <stdlib.h>

int main() {
  int versions[] = {MC_1_18, MC_1_19_2, MC_1_19, MC_1_20, MC_1_21};
  int c_mcs[] = {22, 23, 24, 25, 28};
  int nv = 5;

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

  Generator g;
  for (int v = 0; v < nv; v++) {
    fprintf(stderr, "Processing version %d (c_mc %d)...\n", versions[v],
            c_mcs[v]);
    setupGenerator(&g, versions[v], 0);
    for (int i = 0; i < seed_count; i++) {
      applySeed(&g, DIM_OVERWORLD, (uint64_t)seeds[i]);
      int origin = getBiomeAt(&g, 4, 0, 64, 0);
      int far = getBiomeAt(&g, 4, 5000, 64, 5000);
      printf("%d %lld %d %d\n", c_mcs[v], seeds[i], origin, far);
      if (i % 200 == 0)
        fflush(stdout);
    }
  }

  fprintf(stderr, "Done.\n");
  return 0;
}
