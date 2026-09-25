import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("livrare");

export default function Page() {
  return <ComingSoon page="livrare" />;
}
