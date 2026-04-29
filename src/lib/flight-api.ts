export interface FlightSearchParams {
  origin: string;
  destination: string;
  dateFrom: string;
  dateTo?: string | null;
}

export interface FlightResult {
  price: number;
  link: string;
  currency: string;
}

const FLIGHT_API_BASE = 'https://api.tequila.kiwi.com/v2';
const FLIGHT_API_KEY = process.env.FLIGHT_API_KEY;

export async function fetchCheapestFlight(
  params: FlightSearchParams
): Promise<FlightResult | null> {
  if (!FLIGHT_API_KEY) {
    console.error('FLIGHT_API_KEY not configured');
    return null;
  }

  const { origin, destination, dateFrom, dateTo } = params;

  try {
    const searchParams = new URLSearchParams({
      fly_from: origin,
      fly_to: destination,
      date_from: dateFrom,
      date_to: dateTo || dateFrom,
      select_airlines: '1',
      select_card: 'data',
      limit: '1',
    });

    const response = await fetch(`${FLIGHT_API_BASE}/search?${searchParams}`, {
      headers: {
        'apikey': FLIGHT_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flight API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const cheapestFlight = data.data[0];

    let bookingLink = cheapestFlight.booking_token;
    if (bookingLink) {
      const encodedToken = Buffer.from(bookingLink).toString('base64');
      bookingLink = `https://tequila.kiwi.com/booking/?token=${encodedToken}`;
    } else {
      const route = `${origin}-${destination}`;
      const date = dateFrom.replace(/-/g, '');
      bookingLink = `https://www.kiwi.com/en/?search=${route}&dates=${date},${dateTo?.replace(/-/g, '') || date}`;
    }

    return {
      price: cheapestFlight.price,
      link: bookingLink,
      currency: data.currency || 'BRL',
    };
  } catch (error) {
    console.error('Failed to fetch flight data:', error);
    return null;
  }
}