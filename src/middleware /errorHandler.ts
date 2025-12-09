import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

interface ErrorResponse {
  status: "error";
  message: string;
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      status: "error",
      message: "Invalid data provided",
    });
  }

  //JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Token expired",
    });
  }

  return res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
) => {
  switch (err.code) {
    case "P2002":
      //unique constraint violation
      const field = (err.meta?.target as string[])?.join(", ") || "field";
      return res.status(409).json({
        status: "error",
        message: `A record with this ${field} already exists`,
      });

    case "P2025":
      //record not found
      return res.status(404).json({
        status: "error",
        message: "Record not found",
      });

    case "P2003":
      //foreign key constraint violation
      return res.status(400).json({
        status: "error",
        message: "Invalid reference to related record",
      });

    case "P2014":
      // Required relation violation
      return res.status(400).json({
        status: "error",
        message:
          "The change you are trying to make would violate required relations",
      });

    default:
      return res.status(400).json({
        status: "error",
        message: "Database operation failed",
      });
  }
};
