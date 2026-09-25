import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("cos");

export default function Page() {
  return <ComingSoon page="cos" />;
}
