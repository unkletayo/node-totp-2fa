import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";


export const prisma = new PrismaClient()
const app = express()


async function main() {
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
