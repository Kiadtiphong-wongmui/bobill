import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export const hashPassword = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

export const verifyPassword = async (plainPassword: string, storedPassword: string): Promise<boolean> => {
  const isBcryptHash = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$");
  if (isBcryptHash) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  // Backward compatibility: existing plaintext passwords from old records.
  return plainPassword === storedPassword;
};
