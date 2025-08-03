import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  frontend_url: process.env.FRONTEND_URL,
  bycrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  stripe_client_id: process.env.STRIPE_CLIENT_ID,
  port: process.env.PORT || 4000,
  pass: {
    admin: "admin123",
    deliveryman: "deliveryman123",
    driver: "driver123",
    customer: "customer123",
  },
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN,
    refresh_token_secret: process.env.JWT_REFRESH_SECRET,
    refresh_token_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
  },
  ssl: {
    storeId: process.env.STORE_ID,
    storePass: process.env.STORE_PASS,
    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL,
    failUrl: process.env.FAIL_URL,
    sslPaymentApi: process.env.SSL_PAYMENT_API,
    sslValidationApi: process.env.SSL_VALIDATIOIN_API,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  aws: {
    do_space_endpoint: process.env.DO_SPACE_ENDPOINT,
    do_space_access_key: process.env.DO_SPACE_ACCESS_KEY,
    do_space_secret_key: process.env.DO_SPACE_SECRET_KEY,
    do_space_bucket: process.env.DO_SPACE_BUCKET,
  },
  google: {
    api_key: process.env.GOOGLE_MAP_API_KEY,
  },
  oauth: {
    google: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      client_id: process.env.APPLE_CLIENT_ID,
      team_id: process.env.APPLE_TEAM_ID,
      key_id: process.env.APPLE_KEY_ID,
      private_key: process.env.APPLE_PRIVATE_KEY,
      callback_url: process.env.APPLE_CALLBACK_URL,
    },
    facebook: {
      client_id: process.env.FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET,
    },
    github: {
      client_id: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    twitter: {
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      client_secret: process.env.TWITTER_CONSUMER_SECRET,
    },
    linkedin: {
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    },
  },
};
