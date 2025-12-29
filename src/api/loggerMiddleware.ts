import { Request, Response, NextFunction } from "express"


export function createLoggingMiddleware(){
    return async (req:Request, res:Response, next:NextFunction) => {
        console.log("used middleware")
        next();
    }

}