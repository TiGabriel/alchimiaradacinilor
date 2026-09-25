import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("descopera");

export default function Page() {
  return <ComingSoon page="descopera" />;
}
