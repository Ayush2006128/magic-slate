import { prisma } from '@/lib/prisma';

interface PricingService {
    hasLittleWizard: boolean;
    hasWizard: boolean;
    hasWizardPro: boolean;
};

export const pricingService = async (userId: string): Promise<PricingService> => {
    const userCredits = await prisma.userCredits.findUnique({ where: { userId } });
    const plan = userCredits?.plan || 'free';
    return {
        hasLittleWizard: plan === 'little_wizard',
        hasWizard: plan === 'wizard',
        hasWizardPro: plan === 'wizard_pro',
    };
};
