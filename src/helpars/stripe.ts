import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripe_secret_key as string, {
  // apiVersion: "2025-04-30.basil",
  apiVersion: "2025-07-30.basil",
});

export default stripe;
