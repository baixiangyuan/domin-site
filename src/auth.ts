import { SignJWT, jwtVerify } from 'jose';

export async function createToken(userId: string, secret: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(secret));
}

export async function verifyToken(token: string, secret: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
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
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const { userId } = await verifyToken(token, env.JWT_SECRET);
    return { userId };
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
