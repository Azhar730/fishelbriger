import bcrypt from "bcrypt";
import { Role, User, UserStatus } from "@prisma/client";
import { ENUM_USER_ROLE } from "../../enum/user";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
  const payload: Partial<User> = {
    // firstName: "Super" as string,
    // lastName: "Admin" as string,
    username: "euhan" as string,
    email: "euhan@gmail.com" as string,
    password: "123456" as string,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingSuperAdmin) {
    return;
  }

  await prisma.$transaction(async (TransactionClient) => {
    const hashedPassword: string = await bcrypt.hash(
      payload.password as string,
      12
    );
    const adminId = "#" + Math.floor(Math.random() * 1000000);

    await TransactionClient.user.create({
      data: {
        email: payload.email as string,
        password: hashedPassword,
        username: payload.username as string,
        role: Role.ADMIN,
        contactNo: "0123456789",
        status: UserStatus.ACTIVE,
      },
    });
  });
};
