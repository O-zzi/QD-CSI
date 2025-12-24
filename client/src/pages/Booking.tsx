import { BookingConsole } from "@/components/booking/BookingConsole";

export default function Booking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8 flex items-start justify-center">
      <div className="w-full max-w-7xl">
        <BookingConsole />
      </div>
    </div>
  );
}
