import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  // Default status + message
  let status = 500;
  let message = "Something went wrong";

  // If this is a normal Error object
  if (err instanceof Error) {
    message = err.message;
  }

//   // If error has a `.status` property (custom error)
//   if (typeof err === "object" && err !== null && "status" in err) {
//     const statusValue = (err as any).status;
//     if (typeof statusValue === "number") status = statusValue;
//   }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = 400;
    message = err.message;
  }

  return res.status(status).json({
    type: "server_error",
    message,
  });
};
