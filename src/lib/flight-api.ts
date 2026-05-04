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

export type FlightProvider = 'serpapi' | 'rapidapi' | 'tequila' | 'mock';

export type FlightProviderFunc = (
  params: FlightSearchParams
) => Promise<FlightResult | null>;

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const FLIGHT_API_KEY = process.env.FLIGHT_API_KEY;

export async function fetchCheapestFlight(
  params: FlightSearchParams,
  provider: FlightProvider = 'serpapi'
): Promise<FlightResult | null> {
  switch (provider) {
    case 'serpapi':
      return fetchFromSerpApi(params);
    case 'rapidapi':
      return fetchFromRapidApi(params);
    case 'tequila':
      return fetchFromTequila(params);
    case 'mock':
    default:
      return fetchMock(params);
  }
}

export async function fetchFromSerpApi(
  params: FlightSearchParams
): Promise<FlightResult | null> {
  if (!SERPAPI_KEY) {
    console.warn('SERPAPI_KEY not configured, falling back to mock');
    return fetchMock(params);
  }

  const { origin, destination, dateFrom, dateTo } = params;

  try {
    const searchParams = new URLSearchParams({
      engine: 'google_flights',
      departure_id: origin,
      arrival_id: destination,
      outbound_date: dateFrom,
      return_date: dateTo || dateFrom,
      currency: 'BRL',
      hl: 'pt-BR',
      api_key: SERPAPI_KEY,
    });

    const response = await fetch(`https://serpapi.com/search.json?${searchParams}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpApi error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    const flights = [...(data.best_flights || []), ...(data.other_flights || [])];

    if (flights.length === 0) {
      console.warn('No flights found in SerpApi response');
      return null;
    }

    const cheapestFlight = flights.reduce((best: any, current: any) => {
      const bestPrice = best.price || Infinity;
      const currentPrice = current.price || Infinity;
      return currentPrice < bestPrice ? current : best;
    }, flights[0]);

    const bookingLink = data.search_metadata?.google_flights_url || cheapestFlight.share_link || `https://www.google.com/flights/?q=${origin}+to+${destination}`;

    return {
      price: cheapestFlight.price,
      link: bookingLink,
      currency: data.currency || 'BRL',
    };
  } catch (error) {
    console.error('Failed to fetch from SerpApi:', error);
    return null;
  }
}

export async function fetchFromRapidApi(
  params: FlightSearchParams
): Promise<FlightResult | null> {
  throw new Error('RapidApi integration not implemented yet');
}

async function fetchFromTequila(
  params: FlightSearchParams
): Promise<FlightResult | null> {
  const FLIGHT_API_BASE = 'https://api.tequila.kiwi.com/v2';

  if (!FLIGHT_API_KEY || FLIGHT_API_KEY === '') {
    console.warn('FLIGHT_API_KEY not configured, falling back to mock');
    return fetchMock(params);
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
        apikey: FLIGHT_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tequila API error:', response.status, errorText);
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
    console.error('Failed to fetch from Tequila:', error);
    return null;
  }
}

function fetchMock(params: FlightSearchParams): FlightResult {
  return {
    price: 350,
    link: 'https://kiwi.com/mock',
    currency: 'BRL',
  };
}