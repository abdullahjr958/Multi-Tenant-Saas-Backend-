type SignupResult = {
    accessToken: string;
    refreshToken: string;
};
declare const signupService: (name: string, slug: string, email: string, password: string) => Promise<SignupResult>;
declare const loginService: (email: string, password: string, slug: string) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
declare const refreshTokenService: (refreshToken: string) => Promise<{
    newRefreshToken: string;
    accessToken: string;
}>;
declare const logoutService: (refreshToken: string) => Promise<boolean>;
export { signupService, loginService, refreshTokenService, logoutService };
//# sourceMappingURL=auth.service.d.ts.map