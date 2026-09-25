import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("cont");

export default function Page() {
  return <ComingSoon page="cont" />;
}
