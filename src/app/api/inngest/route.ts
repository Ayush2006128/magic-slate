import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  handleUserAuth,
  handleCreditCheck,
  handlePaymentSuccess,
  handleEnhanceDoodle,
  handleSolveEquation,
} from "@/inngest/functions";

// Register all Inngest workflows
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    handleUserAuth,
    handleCreditCheck,
    handlePaymentSuccess,
    handleEnhanceDoodle,
    handleSolveEquation,
  ],
});
