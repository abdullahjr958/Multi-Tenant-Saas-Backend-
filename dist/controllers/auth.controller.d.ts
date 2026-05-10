import { Request, Response } from "express";
declare const signupController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const loginController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const refreshTokenController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const logoutController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { signupController, loginController, refreshTokenController, logoutController, };
//# sourceMappingURL=auth.controller.d.ts.map