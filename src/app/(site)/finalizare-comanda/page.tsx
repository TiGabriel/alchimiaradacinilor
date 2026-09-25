import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("checkout");

export default function CheckoutPage() {
  return <ComingSoon page="checkout" />;
}
