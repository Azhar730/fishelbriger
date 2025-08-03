import { User } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status"

const createUserIntoDB = async (payload: User) => {
    const user = await prisma.user.findUnique({
        where: {
            email: payload.email
        }
    })
    if (user) {
        throw new ApiError(httpStatus.CONFLICT, 'User already exists !')
    }
    const { password, confirmPassword } = payload
    if (password !== confirmPassword) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Password not match")
    }
    const result = await prisma.user.create({ data: payload })
    return result
};

export const UserServices = {
    createUserIntoDB
}