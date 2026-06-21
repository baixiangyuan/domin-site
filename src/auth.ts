import { SignJWT, jwtVerify } from 'jose';

// Ensure secret is at least 32 bytes (256 bits) for HS256
function getSecret(secret: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(secret);
  if (encoded.length >= 32) return encoded;
  // Pad short secrets to 32 bytes to avoid HMAC key length error
  const padded = new Uint8Array(32);
  padded.set(encoded);
  return padded;
}

export async function createToken(userId: string, secret: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret(secret));
}

export async function verifyToken(token: string, secret: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret), {
      clockTolerance: 60,
    });
    return { userId: payload.userId as string };
  } catch {
    throw new Error('Invalid or expired token');
  }
}

export async function authMiddleware(req: Request, env: { JWT_SECRET: string }): Promise<{ userId: string } | Response> {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const token = auth.slice(7);
  try {
    const { userId } = await verifyToken(token, env.JWT_SECRET);
    return { userId };
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
