import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("cautare");

export default function Page() {
  return <ComingSoon page="cautare" />;
}
