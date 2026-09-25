import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("termeni");

export default function Page() {
  return <ComingSoon page="termeni" />;
}
