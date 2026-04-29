'use server';

const ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD || '';

export async function verifyPassword(password: string): Promise<boolean> {
  if (!ACCESS_PASSWORD) {
    return false;
  }
  return password === ACCESS_PASSWORD;
}

export async function checkUrlAuth(password: string): Promise<boolean> {
  return verifyPassword(password);
}