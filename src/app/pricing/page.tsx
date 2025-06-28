import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-5">Pricing</h1>
      <PricingTable />
    </div>
  );
}