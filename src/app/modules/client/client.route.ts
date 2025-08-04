import { Router } from "express";
import { ClientControllers } from "./client.controller";

const router = Router()

router.post('/create-client', ClientControllers.createClient)
router.get('/', ClientControllers.getClients)

export const ClientRoutes = router