import bcrypt from 'bcrypt';
import prisma from '../../shared/prisma';
import { User } from '@prisma/client';
// import { User } from '@prisma/client';

const prismaWithExtensions = prisma.$extends({
  model: {
    user: {
      async isUserExists(email: string): Promise<Partial<User> | null> {
        // Implement your logic to check if a user with the given ID exists.
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
      },

      async isUserNameExists(username: string): Promise<Partial<User> | null> {
        // Implement your logic to check if a user with the given ID exists.
        const user = await prisma.user.findUnique({ where: { username } });
        return user;
      },

      async isPasswordMatched(
        givenPassword: string,
        savedPassword: string
      ): Promise<boolean> {
        // Implement your logic to compare passwords using bcrypt.
        return bcrypt.compare(givenPassword, savedPassword);
      },
    },
  },
});

export default prismaWithExtensions;