import { BookingConsole } from "@/components/booking/BookingConsole";

export default function Booking() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <BookingConsole />
      </div>
    </div>
  );
}
