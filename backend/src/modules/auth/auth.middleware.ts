import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

type SessionPayload = {
  id: number;
  username: string;
  roles: ("ADMIN" | "USER")[];
  iat: number;
  exp: number;
};

const getSecret = (): string => process.env.AUTH_SECRET ?? "dev-only-change-this-secret";
const toBase64Url = (value: string): string => Buffer.from(value).toString("base64url");
const fromBase64Url = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

const sign = (encodedPayload: string): string => {
  return createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
};

export const verifySessionToken = async (token: string): Promise<SessionPayload | null> => {
  try {
    const [encodedPayload, providedSignature] = token.split(".");
    if (!encodedPayload || !providedSignature) return null;

    const expectedSignature = sign(encodedPayload);
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<SessionPayload>;
    if (
      !payload ||
      typeof payload.id !== "number" ||
      typeof payload.username !== "string" ||
      !Array.isArray(payload.roles) ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

    return payload as SessionPayload;
  } catch {
    return null;
  }
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    const session = await verifySessionToken(token);
    if (!session) return res.status(401).json({ message: "Unauthorized" });

    (req as any).session = session;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
