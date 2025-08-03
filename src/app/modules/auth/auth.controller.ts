import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";
import { ILoginResponse } from "./auth.interface";
import config from "../../../config";

const login = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);

  //set refresh token into cookie
  const cookieOptions = {
    secure: config.env === `production`,
    httpOnly: true,
  };

  res.cookie(`refreshToken`, result.refreshToken, cookieOptions);
  const { refreshToken, ...others } = result;

  sendResponse<ILoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `login successfull`,
    data: others,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = AuthService.refreshToken(refreshToken);

  //set refresh token into cookie
  const cookieOptions = {
    secure: config.env === `production`,
    httpOnly: true,
  };

  res.cookie(`refreshToken`, refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `refresh token generated a new access token`,
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = req.user;
  const { ...passwordData } = req.body;
  const result = await AuthService.changePassword(user!, passwordData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `password changed`,
    data: result,
  });
});

const checkOTPValidation = catchAsync(async (req, res) => {
  const result = await AuthService.checkOTPValidation({ ...req?.body });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `otp validated successfully`,
    data: result,
  });
});

const verifyUser = catchAsync(async (req, res) => {
  const result = await AuthService.verifyUser({ ...req?.body });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `user varified successfully`,
    data: result,
  });
});

const resetPasswordRequest = catchAsync(async (req, res) => {
  const result = await AuthService.resetPasswordRequest(req?.body?.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `password reset request sent successfully`,
    data: result,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const data = await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: data,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization || "";

  await AuthService.resetPassword(token, req?.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null,
  });
});

const googleOauthLogin = catchAsync(async (req, res) => {
  const { refreshToken, ...others } = await AuthService.googleOauthLogin(
    req?.user
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "google Login successfully!",
    data: others,
  });
  //  res.redirect(`http://localhost:3000/auth/login?accessToken=${accessToken}`);
});

const appleOauthLogin = catchAsync(async (req, res) => {
  const { refreshToken, ...others } = await AuthService.appleOauthLogin(
    req?.user
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "google Login successfully!",
    data: others,
  });
  //  res.redirect(`http://localhost:3000/auth/login?accessToken=${accessToken}`);
});

export const AuthController = {
  login,
  refreshToken,
  changePassword,
  resetPasswordRequest,
  verifyUser,
  resetPassword,
  checkOTPValidation,
  googleOauthLogin,
  appleOauthLogin,
  forgotPassword,
};
