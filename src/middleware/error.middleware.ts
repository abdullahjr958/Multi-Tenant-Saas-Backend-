import { Request, Response, NextFunction } from "express";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if(res.headersSent)
        return next(err);

    let statusCode = 500;

    if("statusCode" in err && typeof err.statusCode === "number")
        statusCode = err.statusCode;

    console.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl
    });

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    })
}

export default errorHandler;