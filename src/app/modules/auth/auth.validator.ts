import { z } from 'zod';

const login = z.object({
  body: z.object({
    contactNo: z.string({
      required_error: `contactNo is required`,
    }),
    password: z.string({
      required_error: `user password is required`,
    }),
  }),
});

const refreshToken = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: `refresh token is required`,
    }),
  }),
});

const changePassword = z.object({
  body: z.object({
    oldPassword: z.string({
      required_error: `old password is required`,
    }),
    newPassword: z.string({
      required_error: `new password is required`,
    }),
  }),
});

const resetPasswordReq = z.object({
  body: z.object({
    email: z.string({
      required_error: `old password is required`,
    }).email({message: `invalid email address`})
  }),
});


const checkOTPValidation = z.object({
  body: z.object({
    email: z.string({
      required_error: `old password is required`,
    }).email({message: `invalid email address`}),
    otp: z.number({required_error: "otp is required"}).min(6).max(6),
  }),
})

const resetPassword = z.object({
  body: z.object({
    email: z.string({
      required_error: `old password is required`,
    }).email({message: `invalid email address`}),
    otp: z.number({required_error: "otp is required"}).min(6).max(6),
    password: z.string({required_error: `password is required`})
  }),
})

export const AuthValidator = { login, refreshToken, changePassword, resetPasswordReq, checkOTPValidation, };
