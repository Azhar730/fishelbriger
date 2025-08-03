import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidator } from "./auth.validator";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import { ENUM_USER_ROLE } from "../../../enum/user";
import passport from "passport";
import config from "../../../config";

const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: config.oauth.google.client_id as string,
      clientSecret: config.oauth.google.client_secret as string,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(`see profile`, profile);
      console.log(`see json`, profile?._json);
      console.log(`see accessToken`, accessToken);
      console.log(`see refreshToken`, refreshToken);
      const json = profile?._json;

      try {
        const name = json?.name,
          username = json?.name?.split(` `).join(""),
          avatar = json?.picture,
          email = json?.email;

        const newUser = {
          username,
          avatar,
          email,
          role: ENUM_USER_ROLE.CUSTOMER,
          customer: {
            fullName: name,
            location: ` `,
          },
        };

        done(null, newUser); // Pass the new user to the next middleware
      } catch (error) {
        done(error); // Handle error
      }
    }
  )
);

passport.use(
  new AppleStrategy(
    {
      clientID: config.oauth.apple.client_id as string,
      teamID: config.oauth.apple.team_id as string,
      keyID: config.oauth.apple.key_id as string,
      privateKeyLocation: config.oauth.apple.private_key as string,
      callbackURL: "/api/v1/auth/apple/callback",
      scope: ["email", "name"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, idToken, profile, cb) => {
      try {
        let email, fullName;

        if (profile) {
          email = profile.email;
          fullName = profile.name;
        } else if (idToken) {
          const decodedToken = JSON.parse(
            Buffer.from(idToken.split(".")[1], "base64").toString()
          );
          email = decodedToken.email;
        }

        const user = {
          id: idToken,
          email,
          fullName: fullName || "Unknown",
          avatar: null,
          role: ENUM_USER_ROLE.CUSTOMER,
        };

        cb(null, user);
      } catch (error: any) {
        cb(error);
      }
    }
  )
);

router.route(`/verification`).post(AuthController.verifyUser);

router.route(`/reset-password-req`).post(AuthController.forgotPassword);

router
  .route(`/reset-password`)
  .post(
    auth(
      ENUM_USER_ROLE.CUSTOMER,
      ENUM_USER_ROLE.DRIVER,
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.DELIVERYMAN,
      ENUM_USER_ROLE.SUPER_ADMIN
    ),
    AuthController.resetPassword
  );

router.route(`/check-otp-validation`).post(AuthController.checkOTPValidation);

router.route(`/login`).post(
  // validateRequest(AuthValidator.login),
  AuthController.login
);

router
  .route(`/refresh-token`)
  .post(
    validateRequest(AuthValidator.refreshToken),
    AuthController.refreshToken
  );

router
  .route(`/change-password`)
  .post(
    validateRequest(AuthValidator.changePassword),
    auth(
      ENUM_USER_ROLE.ADMIN,
      ENUM_USER_ROLE.CUSTOMER,
      ENUM_USER_ROLE.DRIVER,
      ENUM_USER_ROLE.DELIVERYMAN
    ),
    AuthController.changePassword
  );

router.route(`/google`).get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// New callback route at /api/auth/google/callback
router
  .route(`/google/callback`)
  .get(
    passport.authenticate("google", { session: false }),
    AuthController.googleOauthLogin
  );

router.route(`/apple`).get(passport.authenticate("apple"));

router
  .route(`/applel/callback`)
  .get(
    passport.authenticate("apple", { session: false }),
    AuthController.appleOauthLogin
  );

export const AuthRouter = router;
