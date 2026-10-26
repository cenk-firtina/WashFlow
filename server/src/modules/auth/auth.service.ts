import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/http';
import { AuthUser, signToken } from '../../middleware/auth';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new ApiError(401, 'E-posta veya sifre hatali.');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'E-posta veya sifre hatali.');

  const authUser: AuthUser = { id: user.id, email: user.email, role: user.role, name: user.name };
  return { token: signToken(authUser), user: authUser };
}
