import { BookingConsole } from "@/components/booking/BookingConsole";
import { useSEO } from "@/hooks/use-seo";

export default function Booking() {
  useSEO({
    title: "Book a Facility",
    description: "Book sports facilities at The Quarterdeck - Padel Tennis, Squash, Air Rifle Range and more. Easy online booking with real-time availability.",
  });
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <BookingConsole />
      </div>
    </div>
  );
}
