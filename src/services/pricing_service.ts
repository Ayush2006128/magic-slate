import { auth } from "@clerk/nextjs/server";

const {has} =  await auth();
const hasLittleWizard = has({
    plan: "little_wizard"
});

const hasWizard = has({
    plan: "wizard"
});

const hasWizardPro = has({
    plan: "wizard_pro"
});

interface PricingService {
    hasLittleWizard: boolean;
    hasWizard: boolean;
    hasWizardPro: boolean;
};

export const pricingService: PricingService = {
    hasLittleWizard,
    hasWizard,
    hasWizardPro
};