import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("favorite");

export default function Page() {
  return <ComingSoon page="favorite" />;
}
