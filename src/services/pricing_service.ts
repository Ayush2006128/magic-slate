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

export const pricingService = async (): Promise<PricingService> => {
    if (await hasLittleWizard) {
        return {
            hasLittleWizard: true,
            hasWizard: false,
            hasWizardPro: false
        };
    }
    if (await hasWizard) {
        return {
            hasLittleWizard: false,
            hasWizard: true,
            hasWizardPro: false
        };
    }
    if (await hasWizardPro) {
        return {
            hasLittleWizard: false,
            hasWizard: false,
            hasWizardPro: true
        };
    }
    return {
        hasLittleWizard: false,
        hasWizard: false,
        hasWizardPro: false
    };
};
