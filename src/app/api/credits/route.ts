import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { pricingService } from '@/services/pricing_service';
import { getUserCreditStatus } from '@/services/credits_service';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get plan from pricingService
  const planInfo = await pricingService();
  let plan = 'free';
  if (planInfo.hasWizardPro) plan = 'wizard_pro';
  else if (planInfo.hasWizard) plan = 'wizard';
  else if (planInfo.hasLittleWizard) plan = 'little_wizard';

  // Get credits
  const credits = await getUserCreditStatus(userId, plan);

  return NextResponse.json({
    ...credits,
  });
} 