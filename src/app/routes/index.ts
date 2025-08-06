import express from "express";
import { AuthRoutes } from "../modules/auth/auth.router";
import { ClientRoutes } from "../modules/client/client.route";
import { CalculatorRoutes } from "../modules/calculator/calculator.route";
import { UserRoutes } from "../modules/user/user.route";
const router = express.Router();

const moduleRoutes: { path: string; route: any }[] = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/client",
    route: ClientRoutes,
  },
  {
    path: "/calculator",
    route: CalculatorRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
