import { Request, Response, NextFunction } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isDev = process.env.NODE_ENV === "development";
  
  // Log detallado solo en desarrollo
  if (isDev) {
    console.error("❌ [API ERROR]:", err);
  }

  let status = err.status || err.statusCode || 500;
  let message = err.message || "Error interno del servidor";
  let code = err.code || "INTERNAL_ERROR";

  // Manejo de errores específicos de Base de Datos (TypeORM)
  if (err.name === "QueryFailedError") {
    status = 400;
    message = "Error en la operación de base de datos.";
    code = "DB_QUERY_FAILED";
    if (err.message.includes("duplicate key") || err.message.includes("UNIQUE constraint")) {
      status = 409;
      message = "Ya existe un registro con esos datos.";
      code = "DUPLICATE_ENTRY";
    }
  }

  // Manejo de errores de validación (Zod o similares)
  if (err.name === "ZodError" || err.issues) {
    status = 400;
    message = "Datos de entrada inválidos.";
    code = "VALIDATION_ERROR";
    res.status(status).json({
      error: { message, code, details: err.issues || err.errors }
    });
    return;
  }

  res.status(status).json({
    error: {
      status,
      code,
      message,
      ...(isDev && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ 
    error: {
      status: 404,
      code: "NOT_FOUND",
      message: `Ruta no encontrada: ${req.method} ${req.url}`
    }
  });
};

export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
