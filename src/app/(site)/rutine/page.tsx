import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";

export const metadata = comingSoonMetadata("rutine");

export default function Page() {
  return <ComingSoon page="rutine" />;
}
