import { jwtVerify } from 'jose';
import { prisma } from './prisma';

export async function getUserFromRequest(request: Request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.userId) }
    });

    return user;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
} 