import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CalculatorServices } from "./calculator.service";
import httpStatus from 'http-status'

const createOrUpdateCalculator = catchAsync(async (req, res) => {
    const { userId } = req.user as { userId: string };
    const result = await CalculatorServices.createOrUpdateCalculatorIntoDB(req.body, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Calculator created successfuly!",
        data: result,
    });
});

export const CalculatorControllers = {
    createOrUpdateCalculator
}