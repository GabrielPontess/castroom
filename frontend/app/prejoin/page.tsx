import PreJoinPanel from "@/components/PreJoinPanel";

interface PreJoinPageProps {
  searchParams: {
    roomName?: string;
    name?: string;
    role?: string;
  };
}

export default function PreJoinPage({ searchParams }: PreJoinPageProps) {
  return <PreJoinPanel searchParams={searchParams} />;
}
