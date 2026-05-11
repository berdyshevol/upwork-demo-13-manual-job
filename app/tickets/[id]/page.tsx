import { notFound } from "next/navigation";
import Link from "next/link";
import { getTicket, getRules } from "@/lib/store";
import { TicketDetail } from "@/components/ticket-detail";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = getTicket(parseInt(id, 10));
  if (!ticket) notFound();
  const rules = getRules();
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-slate-600 hover:underline">← All tickets</Link>
      <TicketDetail ticket={ticket} rules={rules} />
    </div>
  );
}
