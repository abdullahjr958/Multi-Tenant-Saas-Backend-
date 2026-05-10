import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

const requireRole = (...allowedRoles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
    if(allowedRoles.length === 0) return next();

    const userRole = req.user?.role;
    if(!userRole) return res.status(403).json({ message: 'User role not found' });

    if(!allowedRoles.includes(userRole)) 
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    
    next();
}

export default requireRole;