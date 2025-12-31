import { Request, Response, NextFunction } from "express";
import { WALWriter, LogEvent } from "../wal/walWriter";

export function createLoggingMiddleware(walWriter: WALWriter) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`; //request-id generation logic
    let responseLogged = false;

    const requestEvent: LogEvent = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      request: req.body,
      truncated: false,
    };

    walWriter.appendData(requestEvent).catch((error) => {
      console.error("[loggerMiddleware] could not append the data.", error);
    });

    // Intercept response to capture response data
    const originalJson = res.json.bind(res);
    const originalEnd = res.end.bind(res);

    res.json = function (data: any) {
      const duration = Date.now() - startTime;

      const responseEvent: LogEvent = {
        requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        request: req.body,
        response: data,
        truncated: false,
      };

      // Write response log to WAL
      // Again, async but non-blocking
      // We write BEFORE sending response to ensure log is in WAL
      walWriter.appendData(responseEvent).catch((error) => {
        console.error(
          "[LoggerMiddleware] Failed to write response log:",
          error,
        );
      });

      responseLogged = true; // update the flag as will stop the repeated logging of response.

      // Send response immediately (non-blocking on WAL write)
      return originalJson(data);
    };

    res.end = function (chunk?: any, encoding?: any) {
      if (!responseLogged) {
        const duration = Date.now() - startTime;

        // For non-JSON responses, capture as string
        const responseData = chunk ? chunk.toString() : null;

        const responseEvent: LogEvent = {
          requestId,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          request: req.body,
          response: responseData,
          truncated: false,
        };

        // Write response log to WAL
        // Again, async but non-blocking
        // We write BEFORE sending response to ensure log is in WAL
        walWriter.appendData(responseEvent).catch((error) => {
          console.error(
            "[LoggerMiddleware] Failed to write response log:",
            error,
          );
        });

        responseLogged = true; // update the flag as will stop the repeated logging of response.
      }
      // Send response immediately (non-blocking on WAL write)
      return originalEnd(chunk, encoding);
    };
    // console.log("used middleware")
    next();
  };
}
