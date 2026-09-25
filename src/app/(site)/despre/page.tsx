import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("despre");

export default function Page() {
  return <ComingSoon page="despre" />;
}
