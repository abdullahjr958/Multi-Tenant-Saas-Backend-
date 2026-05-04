import { ZodType, infer as zinfer } from "zod";
import { Request, Response, NextFunction } from "express";

const reqBodyValidator =
  <T extends ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
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

export { reqBodyValidator };
