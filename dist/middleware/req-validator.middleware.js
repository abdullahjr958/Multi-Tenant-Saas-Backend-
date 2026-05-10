"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reqBodyValidator = void 0;
const reqBodyValidator = (schema) => (req, res, next) => {
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
    req.body = parsed.data;
    next();
};
exports.reqBodyValidator = reqBodyValidator;
//# sourceMappingURL=req-validator.middleware.js.map