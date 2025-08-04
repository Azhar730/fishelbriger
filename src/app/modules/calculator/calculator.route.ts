import { Router } from "express";
import { CalculatorControllers } from "./calculator.controller";

const router = Router()

router.post('/create-calculator', CalculatorControllers.createOrUpdateCalculator)

export const CalculatorRoutes = router