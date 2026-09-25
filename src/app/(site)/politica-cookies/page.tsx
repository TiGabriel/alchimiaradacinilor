import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("cookies");

export default function Page() {
  return <ComingSoon page="cookies" />;
}
