const envVarsVerifier = () => {
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN_MINUTES;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN_DAYS;
  if (
    !jwtAccessSecret ||
    !jwtAccessExpiresIn ||
    !jwtRefreshSecret ||
    !jwtRefreshExpiresIn
  )
    throw new Error("From auth.service: JWT environment variables are not properly set");

  return true;
}

export default envVarsVerifier;