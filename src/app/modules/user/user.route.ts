import { Router } from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidations } from "./user.validation";
import { FileHelper } from "../../../helpars/file-helper";

const router = Router()

router.post('/create-admin',FileHelper.upload.single('file'),validateRequest(UserValidations.createAdmin), UserControllers.createAdmin)

export const UserRoutes = router