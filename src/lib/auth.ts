import { jwtVerify } from 'jose';
import { prisma } from './prisma';
import { cookies } from 'next/headers';

export async function getUserFromRequest() {
  try {
    // Use Next.js cookies() function instead of accessing request directly
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
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