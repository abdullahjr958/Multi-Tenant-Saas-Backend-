import { ZodType, infer as zinfer } from "zod";
import { Request, Response, NextFunction } from "express";

const reqBodyValidator =
  <T extends ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      if(process.env.NODE_ENV !== "production")
        parsed.error.issues.map((issue) => console.log(issue.message));
      
      return res.status(400).json({
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = parsed.data as zinfer<T>;
    next();
  };

const reqQueryValidator = <T extends ZodType>(schema: T) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.query);

  if(!parsed.success){
    if(process.env.NODE_ENV !== "production")
      parsed.error.issues.map(issue => console.log(issue.message));

    return res.status(400).json({
      errors: parsed.error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    })
  }

  req.query = parsed.data as any;
  next();
}

export { reqBodyValidator, reqQueryValidator };
