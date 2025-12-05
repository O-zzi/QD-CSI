export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function formatPKR(val: number): string {
  return val.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 });
}

export function calculateEndTime(start: string, duration: number): string {
  const [h, m] = start.split(':').map(Number);
  const totalMins = h * 60 + m + duration;
  const endH = Math.floor(totalMins / 60);
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function isOffPeak(time: string): boolean {
  const hour = parseInt(time.split(':')[0]);
  return hour >= 10 && hour < 17;
}
