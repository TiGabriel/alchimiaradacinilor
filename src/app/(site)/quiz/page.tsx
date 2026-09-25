import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("quiz");

export default function Page() {
  return <ComingSoon page="quiz" />;
}
