import { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";
declare const reqBodyValidator: <T extends ZodType>(schema: T) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export { reqBodyValidator };
//# sourceMappingURL=req-validator.middleware.d.ts.map