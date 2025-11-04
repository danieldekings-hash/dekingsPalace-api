import jwt, { SignOptions, Secret } from "jsonwebtoken";

type JwtUser = { id: string; role: string; email?: string };

export function signAccessToken(payload: JwtUser) {
  const secret: Secret = (process.env.JWT_SECRET as string);
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN as any) || "24h" };
  return jwt.sign(payload as object, secret, options);
}

export function signRefreshToken(payload: JwtUser & { tokenVersion?: number }) {
  const secret: Secret = (process.env.JWT_REFRESH_SECRET as string) || (process.env.JWT_SECRET as string);
  const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || "7d" };
  return jwt.sign(payload as object, secret, options);
}

export function verifyRefreshToken(token: string) {
  const secret: Secret = (process.env.JWT_REFRESH_SECRET as string) || (process.env.JWT_SECRET as string);
  return jwt.verify(token, secret) as any;
}


