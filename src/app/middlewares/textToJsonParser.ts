import { Request, Response, NextFunction } from 'express';

const textToJSONParser = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req?.body?.data) {
    req.body = JSON.parse(req.body.data);
  }
  next();
};

export default textToJSONParser;