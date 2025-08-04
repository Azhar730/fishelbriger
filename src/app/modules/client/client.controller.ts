import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ClientServices } from "./client.service";
import httpStatus from 'http-status'

const createClient = catchAsync(async (req, res) => {
    const { userId } = req.user as { userId: string };
    const result = await ClientServices.createClientIntoDB(req.body, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Client Created successfuly!",
        data: result,
    });
});
const getClients = catchAsync(async (req, res) => {
    const { userId } = req.user as { userId: string };
    const result = await ClientServices.getClientsFromDB(userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Client retrieved successfuly!",
        data: result,
    });
});

export const ClientControllers = {
    createClient,
    getClients
}