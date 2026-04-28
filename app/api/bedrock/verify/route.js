import { getBdsVerifierStatus, verifyBedrockSeedWithBds } from '@/lib/bedrock-bds-oracle';

export const runtime = 'nodejs';

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

export async function GET() {
  return json(getBdsVerifierStatus());
}

export async function POST(request) {
  const body = await request.json();
  const status = getBdsVerifierStatus();

  if (!status.available) {
    return json({ status: 'unavailable', reason: status.reason }, { status: 503 });
  }

  const result = await verifyBedrockSeedWithBds({
    seed: body.seed,
    version: body.version,
    biome: body.biome || 'any',
    structures: Array.isArray(body.structures) ? body.structures : [],
    radius: Number(body.radius) || 0,
    maxStructureDistance: Number(body.maxStructureDistance) || 0,
    maxBiomeStructureDistance: Number(body.maxBiomeStructureDistance) || 0,
  });

  return json(result);
}
