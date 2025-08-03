import { Router } from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidations } from "./user.validation";

const router = Router()

router.post('/create-user', validateRequest(UserValidations.createUser), UserControllers.createUser)

export const UserRoutes = router