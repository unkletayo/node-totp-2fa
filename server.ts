import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";


declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
    qr: string;
    email: string
  }
}

import authRouter from "./routes/auth.route";

export const prisma = new PrismaClient()
const app = express()

async function main() {
  app.use(session({
    secret: 'supersecret',
  }))



  app.use(morgan('dev'))

  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
    })
  )

  app.use(express.json())

  app.get("/api/health-checker", (req: Request, res: Response) => {
    res.status(200).json({
      status: 'Success',
      message: "Welcome to Two-Factor Authentication with Node.js",
    })
  })

  app.use("/api/auth", authRouter);

  app.all("*", (req: Request, res: Response) => {
    return res.status(404).json({
      status: 'fail',
      message: `Route: ${req.originalUrl} not found`
    })
  })

  const PORT = 8000;
  app.listen(PORT, () => {
    console.info(`Server started on port: ${PORT}`);
  });

}

main()
  .then(async () => {
    await prisma.$connect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
