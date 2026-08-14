import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE_NAME = "bobill_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionUser = {
  id: number;
  username: string;
  roles: string[];
};

type SessionPayload = SessionUser & { iat: number; exp: number };

const getSecret = (): string => process.env.AUTH_SECRET ?? "dev-only-change-this-secret";
const toBase64Url = (value: string): string => Buffer.from(value).toString("base64url");
const fromBase64Url = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

const sign = (encodedPayload: string): string => {
  return createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
};

export const authConfig = {
  sessionCookieName: SESSION_COOKIE_NAME,
  sessionMaxAgeSeconds: SESSION_MAX_AGE_SECONDS,
};

export const createSessionToken = async (user: SessionUser): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    id: user.id,
    username: user.username,
    roles: user.roles,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = async (token: string): Promise<SessionPayload | null> => {
  try {
    const [encodedPayload, providedSignature] = token.split(".");
    if (!encodedPayload || !providedSignature) {
      return null;
    }

    const expectedSignature = sign(encodedPayload);
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

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

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
};
