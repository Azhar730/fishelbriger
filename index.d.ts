import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload;
        }
    }
}


declare global {
    namespace Express {
        interface Request {
            user?: User & { userId?: string }; // or the exact shape you expect
        }
    }
}