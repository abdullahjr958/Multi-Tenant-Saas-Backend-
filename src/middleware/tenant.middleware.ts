import { Request, Response, NextFunction } from 'express';

const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) 
        return res.status(400).json({ message: 'Tenant ID header missing' });
    
    next();
}

export default tenantMiddleware;