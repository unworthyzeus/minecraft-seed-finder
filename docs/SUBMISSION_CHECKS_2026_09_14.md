# Email submission checks, 2026-09-14

Both submissions target Bedrock 26.13. Seed strings round-trip through the
application's signed 64-bit normalization without losing precision. Dates are
unknown because neither supplied screenshot shows a submission date.

## Independent reference

Compiled and ran the original C library from
[FragrantResult186/cubiomes-bedrock](https://github.com/FragrantResult186/cubiomes-bedrock/tree/533cbe2a51a3d8cd41547040d50d91a00ac76e43),
commit `533cbe2a51a3d8cd41547040d50d91a00ac76e43`, using GCC 6.3.0 with
`-O2 -fwrapv`. Empty statements after the Ocean_Ruin and Trial_Chambers case
labels were needed for compatibility with this compiler. No generation logic
was changed. The local harness and executable are under the ignored
`.local/seed-verification` directory.

Used `setupGenerator(MC_26_20)`, `applySeed(DIM_OVERWORLD)`, and
`getBiomeAt(scale=1)`. This is an approximate profile for the reported version;
these results are predictions, not a Bedrock 26.13 world inspection.

## Mushroom island: -6458449459515783334

The notation `(-222,361)(-1,158,044)` is interpreted as X=-222361,
Z=-1158044 with thousands separators. No Y was supplied; the catalog retains
null and the detail page displays `?`.

Both C and JavaScript return Mushroom Fields at Y=64. A grid centered on the
reported point, with offsets -512 through +512 inclusive in steps of 64 on
both axes, contains 205 Mushroom Fields samples out of 289 in both generators.
This does not establish the island's full extent or cave geometry.

The C structure scan covers offsets up to 768 blocks on each horizontal axis.
`getStructurePos` and `isViableStructurePos` return these candidates with a
Mushroom Fields surface biome:

| Structure | X | Z |
| --- | ---: | ---: |
| Ruined portal | -222360 | -1158040 |
| Ruined portal | -221800 | -1158024 |
| Trial chambers | -222872 | -1157976 |
| Trial chambers | -222264 | -1158552 |
| Trial chambers | -222152 | -1157992 |
| Trial chambers | -221832 | -1158456 |
| Trial chambers | -221656 | -1158024 |

`getMineshafts` over the corresponding inclusive chunk bounds returns eleven
candidates with a Mushroom Fields surface biome. These include X=-222664,
Z=-1158088 and X=-222520, Z=-1158168. Connections between mineshafts and caves,
portal size, and final structure generation remain unverified.

The current JavaScript portal scan instead predicts X=-222648, Z=-1158072
and X=-221912, Z=-1158360. The catalog now uses the C reference positions and
explicitly discloses the disagreement with the website map. The five trial
chamber positions match. Resolving the portal generator discrepancy is outside
this catalog addition; neither set of portal positions is BDS confirmed.

The submission explicitly says the island is far from spawn, so its category
is Rare Biomes rather than Mushroom Island Spawns.

## Floating island: -397911369891213378

The Japanese report describes a floating island at Y=204 with lava and water
below the mountain. The supplied point is X=-173, Y=204, Z=268.
Both C and JavaScript return Forest there. Neither biome generator determines
whether that point contains a block, a floating island, lava, or water. The
relationship to the actual spawn is also unverified.

## Validation and limits

The catalog audit, local world generation suite, and production build passed.
The local suite includes 16,320 Java placement reference checks and 4,142
Bedrock golden-output checks across 69 selectable versions. These are software
regression checks, not proof of the submitted terrain claims.

No configured BDS verifier or BDS installation was found in the workspace or
Downloads. Both entries retain confidence 0.7 and explicitly require BDS or
in-game confirmation for the unverified claims.
