import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("jurnal");

export default function Page() {
  return <ComingSoon page="jurnal" />;
}
