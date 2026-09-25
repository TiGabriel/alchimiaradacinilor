import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("produse");

export default function Page() {
  return <ComingSoon page="produse" />;
}
