import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { encode } from "hi-base32";
import * as OTPAuth from "otpauth";
import { prisma } from "../server";

const RegisterUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    await prisma.user.create({
      data: {
        name,
        email,
        password: crypto.createHash("sha256").update(password).digest("hex"),
      },
    });

    res.status(201).json({
      status: "success",
      message: "Registered successfully, please login",
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          status: "fail",
          message: "Email already exist, please use another email address",
        });
      }
    }
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


const LoginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "No user with that email exists",
      });
    }

    res.status(200).json({
      status: "success",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        otp_enabled: user.otp_enabled,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}


const generateRandomBase32 = () => {
  const buffer = crypto.randomBytes(15);
  const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
  return base32;
};

const GenerateOTP = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    const user = await prisma.user.findUnique({ where: { id: user_id } });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "No user with that email exists",
      });
    }


    const base32_secret = generateRandomBase32();

    let totp = new OTPAuth.TOTP({
      issuer: "example.com",
      label: "Example",
      algorithm: 'SHA1',
      digits: 6,
      secret: base32_secret,
    })

    let otpauth_url = totp.toString();

    // save the totp to db 
    await prisma.user.update({
      where: {
        id: user_id
      },
      data: {
        otp_auth_url: otpauth_url,
        otp_base32: base32_secret
      }
    })


    res.status(200).json({
      base32: base32_secret,
      otpauth_url
    })


  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }

}


const VerifyOTP = async (req: Request, res: Response) => {
  try {
    const { user_id, token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: user_id } });
    const message = "Token is invalid or user doesn't exist";

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message,
      });
    }

    let totp = new OTPAuth.TOTP({
      issuer: "example.com",
      label: "Example",
      algorithm: 'SHA1',
      digits: 6,
      secret: user.otp_base32!,
    })

    let delta = totp.validate({
      token
    })

    if (delta === null) {
      return res.status(401).json({
        status: "fail",
        message,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user_id },
      data: {
        otp_enabled: true,
        otp_verified: true,
      },
    });

    res.status(200).json({
      otp_verified: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        otp_enabled: updatedUser.otp_enabled,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}



const ValidateOTP = async (req: Request, res: Response) => {
  try {
    const { user_id, token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: user_id } });

    const message = "Token is invalid or user doesn't exist";
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message,
      });
    }
    let totp = new OTPAuth.TOTP({
      issuer: "example.com",
      label: "Example",
      algorithm: "SHA1",
      digits: 6,
      secret: user.otp_base32!,
    });

    let delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      return res.status(401).json({
        status: "fail",
        message,
      });
    }

    res.status(200).json({
      otp_valid: true,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


const DisableOTP = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User doesn't exist",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user_id },
      data: {
        otp_enabled: false,
      },
    });

    res.status(200).json({
      otp_disabled: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        otp_enabled: updatedUser.otp_enabled,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


export default {
  RegisterUser,
  LoginUser,
  GenerateOTP,
  VerifyOTP,
  ValidateOTP,
  DisableOTP,
};