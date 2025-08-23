import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { addMonths, isAfter } from 'date-fns';

// Plan limits
const PLAN_LIMITS = {
  free: { doodle: 10, equation: 20 },
  little_wizard: { doodle: 20, equation: 30 },
  wizard: { doodle: 100, equation: 200 },
  wizard_pro: { doodle: Infinity, equation: Infinity },
};

export type CreditType = 'doodle' | 'equation';

// Helper function to validate authentication
async function validateAuth(userId: string): Promise<boolean> {
  try {
    const { userId: authUserId } = await auth();
    return authUserId === userId && !!authUserId;
  } catch (error) {
    return false;
  }
}

async function getOrCreateUserCredits(userId: string, plan: string) {
  // Validate authentication before proceeding
  const isAuthenticated = await validateAuth(userId);
  if (!isAuthenticated) {
    throw new Error('Unauthorized: User must be authenticated to access credits');
  }

  let userCredits = await prisma.userCredits.findUnique({ where: { userId } });
  if (!userCredits) {
    userCredits = await prisma.userCredits.create({
      data: {
        userId,
        plan,
        doodleCredits: 0,
        equationCredits: 0,
        lastReset: new Date(),
      },
    });
  }
  return userCredits;
}

function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS['free'];
}

export async function checkAndResetCredits(userId: string, plan: string) {
  // Validate authentication before proceeding
  const isAuthenticated = await validateAuth(userId);
  if (!isAuthenticated) {
    throw new Error('Unauthorized: User must be authenticated to access credits');
  }

  let userCredits = await getOrCreateUserCredits(userId, plan);
  const now = new Date();
  // Reset if a month has passed since lastReset
  if (isAfter(now, addMonths(userCredits.lastReset, 1))) {
    userCredits = await prisma.userCredits.update({
      where: { userId },
      data: {
        doodleCredits: 0,
        equationCredits: 0,
        lastReset: now,
        plan,
      },
    });
  } else if (userCredits.plan !== plan) {
    // Update plan if changed
    userCredits = await prisma.userCredits.update({
      where: { userId },
      data: { plan },
    });
  }
  return userCredits;
}

export async function canUseCredit(userId: string, plan: string, type: CreditType) {
  // Validate authentication before proceeding
  const isAuthenticated = await validateAuth(userId);
  if (!isAuthenticated) {
    throw new Error('Unauthorized: User must be authenticated to access credits');
  }

  const userCredits = await checkAndResetCredits(userId, plan);
  const limits = getPlanLimits(plan);
  if (limits[type] === Infinity) return true;
  if (type === 'doodle') return userCredits.doodleCredits < limits.doodle;
  if (type === 'equation') return userCredits.equationCredits < limits.equation;
  return false;
}

export async function incrementCredit(userId: string, plan: string, type: CreditType) {
  // Validate authentication before proceeding
  const isAuthenticated = await validateAuth(userId);
  if (!isAuthenticated) {
    throw new Error('Unauthorized: User must be authenticated to access credits');
  }

  await checkAndResetCredits(userId, plan);
  if (type === 'doodle') {
    await prisma.userCredits.update({
      where: { userId },
      data: { doodleCredits: { increment: 1 } },
    });
  } else if (type === 'equation') {
    await prisma.userCredits.update({
      where: { userId },
      data: { equationCredits: { increment: 1 } },
    });
  }
}

// Helper to get current usage and limits for UI
export async function getUserCreditStatus(userId: string, plan: string) {
  // Validate authentication before proceeding
  const isAuthenticated = await validateAuth(userId);
  if (!isAuthenticated) {
    throw new Error('Unauthorized: User must be authenticated to access credits');
  }

  const userCredits = await checkAndResetCredits(userId, plan);
  const limits = getPlanLimits(plan);
  return {
    doodleUsed: userCredits.doodleCredits,
    doodleLimit: limits.doodle,
    equationUsed: userCredits.equationCredits,
    equationLimit: limits.equation,
    plan,
  };
} 