import { Admin, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status"
import { IFile } from "../../../interfaces/file";
import { Request } from "express";
import { FileHelper } from "../../../helpars/file-helper";
import bcrypt from 'bcrypt'

const createAdminIntoDB = async (req: Request): Promise<Admin> => {
  console.log(req.body)
  console.log(req.file)
  const file = req.file as IFile;
  if (file) {
    const uploadToCloudinary = await FileHelper.uploadToCloudinary(file);
    req.body.profilePhoto = uploadToCloudinary?.secure_url;
  }
  if(req.body.password !== req.body.confirmPassword){
    throw new ApiError(httpStatus.UNAUTHORIZED,'Password did not match!')
  }
  const hashedPassword: string = await bcrypt.hash(req.body.password, 12);

  const userData = {
    email: req.body.email,
    password: hashedPassword,
    role: UserRole.ADMIN
  };

  const result = await prisma.$transaction(async (transactionClient) => {
    const createdUser = await transactionClient.user.create({ data: userData });
    const createAdmin = await transactionClient.admin.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        profilePhoto: req.body.profilePhoto,
        user: {
          connect: {
            id: createdUser.id,
          },
        },
      },
    });
    return createAdmin;
  });

  return result;
};



export const UserServices = {
    createAdminIntoDB
}