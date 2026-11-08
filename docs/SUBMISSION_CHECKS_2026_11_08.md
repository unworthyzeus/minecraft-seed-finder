# Submission checks, 2026-11-08

## Stronger verification, superseding the initial checks below

The three wells are confirmed by actual vanilla Java 1.12.2 block generation.
The official server binary has SHA-1
`886945bfb2b978778c3a0288fd7fab09d315b25f`, matching Mojang's version manifest.
The authored `scripts/verification/VerifyDesertWells112.java` harness invokes
the unmodified WorldServer and chunk generator classes with the exact seed,
default terrain, and structures enabled, in a uniquely named fresh world.
It supplies the minimal server context needed for feature population without
starting a network server. The runtime used was Java 19.0.2.

All three wells match their reported water centers: (66, 65, 8322),
(77, 62, 8270), and (67, 62, 8268). For each, 71 assertions check a 5 by 5
sandstone foundation, a five-block water cross and sandstone rim, four
three-block sandstone pillars, and a roof with eight slabs and a sandstone
center. All 213 assertions passed. The machine-readable result is
`docs/VERIFIED_DESERT_WELLS_112.json`. The catalog now uses confidence 1.0.

Reproduce in a scratch directory containing the official jar and harness:

```powershell
Get-FileHash server.jar -Algorithm SHA1
javac -cp server.jar VerifyDesertWells112.java
java -Xmx2G -cp '.;server.jar' VerifyDesertWells112
```

The harness creates a fresh world and JSON evidence in its working directory.
It loads X chunks 1 through 8 and Z chunks 513 through 523 in ascending X,
then Z order, and fails on any mismatching block. Obfuscated API names are
specific to the official 1.12.2 server jar. No Minecraft binary is committed.

The mansion roof spawn is independently corroborated for Bedrock 1.19 by
[GameSkinny's September 30, 2022 gameplay guide](https://www.gameskinny.com/tips/best-ps4-minecraft-119-seeds-for-october-2022/)
and [LOCA's February 16, 2023 guide](https://locablog.hatenablog.com/entry/Minecraft-ver1.19_seed_Woodland_mansion).
Both show gameplay screenshots and describe this seed's rooftop spawn.
LOCA records initial spawn at X=12, Y=102, Z=41. Those published coordinates
now supplement the original submission, with attribution in the description.
The catalog now uses confidence 0.9 and method `published-gameplay`.
This is documentary corroboration, not a local Bedrock 1.19 world inspection.
The installed Bedrock client is newer, so it cannot establish exact 1.19
behavior. The website map discrepancy noted below remains unresolved.

## Initial checks, retained as investigation history

These entries are community reports with partial verification, confidence 0.7.
Neither is claimed to be fully verified. Both numeric seeds round-trip through
the application's seed parser without precision loss.

## Java 1.12.2: 873956122367342323

The email reports wells at (66, 65, 8322), (77, 62, 8270), and (67, 62, 8268),
with reference point (92, 71, 8320). The screenshot does not provide a date.

The original C Cubiomes library at local commit
`e61f90580cbdd883214a8054670dacae655e59c0`, using `MC_1_12`, returns Desert
at all four locations. The application's legacy Java generator agrees.
The maximum reported horizontal pair distance is approximately 54.0 blocks.

`getStructureConfig(Desert_Well, MC_1_12)` returns false: this library cannot
check well placement for that version. Biome agreement does not verify wells,
their Y coordinates, or the terrain required for them to generate. The title
and description retain the claim as reported, pending in-game verification.

## Bedrock 1.19: 165605352

[GitHub issue #8](https://github.com/unworthyzeus/minecraft-seed-finder/issues/8)
was opened on 2026-10-18 by kardampoornima5-cpu. Its current body matches the
screenshot and supplies no coordinates. It reports spawning on a mansion,
despite selecting Monument Anomalies. The catalog uses Spawn Oddities and
preserves the original report in its description.

Compiled the original C library from
[cubiomes-bedrock](https://github.com/FragrantResult186/cubiomes-bedrock/tree/533cbe2a51a3d8cd41547040d50d91a00ac76e43)
at commit `533cbe2a51a3d8cd41547040d50d91a00ac76e43`, with GCC 6.3.0,
`-O2 -fwrapv`. The two empty statements used for compiler compatibility in
the September check remain in place; generation logic was not modified.

Using `MC_1_19`, `getStructurePos(Mansion)` and `isViableStructurePos`
identify a viable candidate at X=8, Z=72 in Dark Forest. `getSpawn` returns
X=0, Z=32, about 40.8 blocks from that candidate's anchor. This function warns
that its spawn result may be inaccurate because it depends on grass blocks.
The library does not establish a roof height or actual player spawn.

The website's Bedrock mansion scan within 512 blocks returns no candidate,
so there is a map discrepancy. The catalog discloses it and retains the
original C evidence as a prediction. No coordinates are invented for the
submission itself. Fixing general mansion prediction is outside this addition.

## Reproduction and limits

Local C harnesses are in the ignored `.local/seed-verification/nov-java.c`
and `nov-bedrock.c`, with matching executables. The Java harness links the
existing original Cubiomes archive. The Bedrock harness compiles against the
original source files listed in that library's makefile.

No BDS executable or Java 1.12.2 server installation was found in the workspace
or Downloads. Installed Minecraft clients do not supply a completed world
inspection. These findings support partial validation only.

The rebuilt catalog audit passes with 7,963 entries and thirteen website
submissions. The production build also passes.
