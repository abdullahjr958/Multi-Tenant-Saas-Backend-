const logger = ( req: any, res: any, next: any) => {
    console.log(`${req.method} ${req.url}`);

    console.log("========== FROM LOGGER MIDDLEWARE ==========")
    // console.log(process.env.DATABASE_URL)
    // console.log(process.env.JWT_REFRESH_SECRET)
    // console.log(process.env.JWT_ACCESS_SECRET)
    next();
}

export default logger;