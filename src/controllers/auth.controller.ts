import { Request, Response } from "express";
import {
  signupService,
  loginService,
  refreshTokenService,
  logoutService,
} from "../service/auth.service";
import { signupSchema, loginSchema } from "../validators/auth.validator";
import { z } from "zod";

const signupController = async (req: Request, res: Response) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).send({ errors: z.flattenError(result.error) });

    const { name, slug, email, password } = result.data;

    const { accessToken, refreshToken } = await signupService(
      name,
      slug,
      email,
      password,
    );

    return res
      .status(201)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .send({ accessToken });
  } catch (error) {
    if (error instanceof Error) res.status(400).send({ error: error.message });
    else res.status(500).send({ error: "Internal Server Error" });
  }
};

const loginController = async (req: Request, res: Response) => {
  try {
    console.log("FROM LOGIN CONTROLLER: ");
    const result = loginSchema.safeParse(req.body);
    if (!result.success){
      console.log("VALIDATION ERROR:", z.flattenError(result.error));
      return res.status(400).send({ errors: z.flattenError(result.error) });
    }

    const { email, password, slug } = result.data;
    const { accessToken, refreshToken } = await loginService(
      email,
      password,
      slug,
    );

    return res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .send({ accessToken });
  } catch (error) {
    if (error instanceof Error) res.status(400).send({ error: error.message });
    else res.status(500).send({ error: "Internal Server Error" });
  }
};

const refreshTokenController = async (req: Request, res: Response) => {
  try {
    let { refreshToken } = req.cookies;
    console.log("FROM REFRESH TOKEN CONTROLLER, refreshToken:", refreshToken);
    if (!refreshToken)
      return res.status(400).json({ message: "No refresh token provided" });
    const { newRefreshToken, accessToken } = await refreshTokenService(refreshToken);

    return res
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .json({ accessToken });
  } catch (error) {
    if (error instanceof Error) res.status(400).send({ error: error.message });
    else res.status(500).send({ error: "Internal Server Error" });
  }
};

const logoutController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(400).json({ message: "No refresh token provided" });
    await logoutService(refreshToken);

    return res
      .status(200)
      .clearCookie("refreshToken")
      .send({ message: "Logged out successfully" });
  } catch (error) {
    if (error instanceof Error) res.status(400).send({ error: error.message });
    else res.status(500).send({ error: "Internal Server Error" });
  }
};

export {
  signupController,
  loginController,
  refreshTokenController,
  logoutController,
};
