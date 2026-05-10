import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Role } from '@prisma/client';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) 
    return res.status(401).json({ message: 'Authorization header missing' });
  
  const token = authHeader.split(' ')[1];
  if (!token) 
    return res.status(401).json({ message: 'Token missing' });

  try{
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload & { userId: string, tenantId: string, role: Role };
    req.user = decoded;
  }
  catch(error){
    return res.status(401).json({ message: 'Invalid token' });
  }

  next();
};

export default authMiddleware;