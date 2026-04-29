export type FlightAlert = {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  target_price: number;
  is_active: boolean;
  last_notified_price: number | null;
  created_at: string;
};

export type PriceHistory = {
  id: string;
  alert_id: string;
  price_found: number;
  booking_link: string;
  checked_at: string;
};