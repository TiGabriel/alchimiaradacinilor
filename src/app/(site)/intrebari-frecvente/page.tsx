import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("faq");

export default function Page() {
  return <ComingSoon page="faq" />;
}
