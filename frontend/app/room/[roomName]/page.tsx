import RoomPageClient from "@/components/RoomPageClient";

interface RoomPageProps {
  params: {
    roomName: string;
  };
  searchParams: {
    name?: string;
    role?: string;
    camera?: string;
    mic?: string;
  };
}

export default function RoomPage({ params, searchParams }: RoomPageProps) {
  return <RoomPageClient roomName={params.roomName} searchParams={searchParams} />;
}
