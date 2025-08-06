import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserServices } from "./user.service";
import httpStatus from 'http-status'

const createAdmin = catchAsync(async (req, res) => {
    const result = await UserServices.createAdminIntoDB(req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin Created successfuly!",
        data: result,
    });
});

export const UserControllers = {
    createAdmin
}