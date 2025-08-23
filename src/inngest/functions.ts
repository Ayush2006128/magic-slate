import { inngest } from "./client";
import { checkAndResetCredits, canUseCredit, incrementCredit } from "@/services/credits_service";
import { pricingService } from "@/services/pricing_service";
import { enhanceDoodle } from "@/ai/flows/enhance-doodle";
import { solveEquation } from "@/ai/flows/solve-equation";

// 1. User Signup/Login: Initialize credits on Clerk user creation
export const handleUserAuth = inngest.createFunction(
  { id: "handle-user-auth" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    try {
      await step.run("init-credits", async () => {
        await checkAndResetCredits(event.data.id, "free");
      });
      return { status: "initialized" };
    } catch (error) {
      console.error("Failed to initialize credits:", error);
      return { status: "error", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
);

// 2. Credit Check & Increment: For AI function requests
export const handleCreditCheck = inngest.createFunction(
  { id: "handle-credit-check" },
  { event: "ai/function.requested" },
  async ({ event, step }) => {
    try {
      const { userId, plan, type } = event.data;
      
      // Validate that we have required data
      if (!userId || !plan || !type) {
        return { error: "Missing required data: userId, plan, or type" };
      }

      const canUse = await canUseCredit(userId, plan, type);
      if (!canUse) {
        return { error: "Credit limit reached" };
      }
      
      await incrementCredit(userId, plan, type);
      // Optionally trigger next workflow (AI function)
      return { status: "credit incremented" };
    } catch (error) {
      console.error("Credit check failed:", error);
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return { error: "Authentication required" };
      }
      return { error: "Credit check failed", details: error instanceof Error ? error.message : "Unknown error" };
    }
  }
);

// 3. Payment Success: Update plan and reset credits
export const handlePaymentSuccess = inngest.createFunction(
  { id: "handle-payment-success" },
  { event: "payment/success" },
  async ({ event, step }) => {
    try {
      const { userId, newPlan } = event.data;
      
      // Validate that we have required data
      if (!userId || !newPlan) {
        return { error: "Missing required data: userId or newPlan" };
      }

      // Update credits and plan
      await step.run("update-plan", async () => {
        await checkAndResetCredits(userId, newPlan); // Will update plan if changed
      });
      return { status: "plan updated" };
    } catch (error) {
      console.error("Payment success handling failed:", error);
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return { error: "Authentication required" };
      }
      return { error: "Plan update failed", details: error instanceof Error ? error.message : "Unknown error" };
    }
  }
);

// 4. AI Function Execution: Enhance Doodle
export const handleEnhanceDoodle = inngest.createFunction(
  { id: "handle-enhance-doodle" },
  { event: "ai/enhance-doodle" },
  async ({ event, step }) => {
    try {
      const result = await enhanceDoodle(event.data);
      return { status: "success", result };
    } catch (error) {
      let message = "Unknown error";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      }
      return { status: "error", error: message };
    }
  }
);

// 4. AI Function Execution: Solve Equation
export const handleSolveEquation = inngest.createFunction(
  { id: "handle-solve-equation" },
  { event: "ai/solve-equation" },
  async ({ event, step }) => {
    try {
      const result = await solveEquation(event.data);
      return { status: "success", result };
    } catch (error) {
      let message = "Unknown error";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      }
      return { status: "error", error: message };
    }
  }
);

// 5. (Optional) Error/Retry Handling can be added via Inngest's built-in retry logic or by emitting events on error.
