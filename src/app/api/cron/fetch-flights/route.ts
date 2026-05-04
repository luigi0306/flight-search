export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { fetchCheapestFlight, type FlightSearchParams } from '@/lib/flight-api';
import { sendTelegramNotification } from '@/lib/telegram';

interface FlightAlertInput {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  target_price: number;
  last_notified_price: number | null;
}

interface PriceHistoryInput {
  alert_id: string;
  price_found: number;
  booking_link: string;
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data: alerts, error: fetchError } = await supabase
      .from('flight_alerts')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching alerts:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'No active alerts to process' });
    }

    const results = [];

    for (const alert of alerts as unknown as FlightAlertInput[]) {
      const searchParams: FlightSearchParams = {
        origin: alert.origin,
        destination: alert.destination,
        dateFrom: alert.departure_date,
        dateTo: alert.return_date,
      };

      const flight = await fetchCheapestFlight(searchParams);

      if (!flight) {
        results.push({ alertId: alert.id, status: 'no_flight_found' });
        continue;
      }

      const priceHistoryRecord: PriceHistoryInput = {
        alert_id: alert.id,
        price_found: flight.price,
        booking_link: flight.link,
      };

      const { error: insertError } = await supabase.from('price_history').insert(priceHistoryRecord);

      if (insertError) {
        console.error('Error inserting price history:', insertError);
      }

      const shouldNotify =
        flight.price <= alert.target_price &&
        flight.price !== alert.last_notified_price;

      if (shouldNotify) {
        console.log(`[NOTIFICATION] Would send Telegram with link: ${flight.link}`);
        const notified = await sendTelegramNotification({
          origin: alert.origin,
          destination: alert.destination,
          departureDate: alert.departure_date,
          returnDate: alert.return_date,
          priceFound: flight.price,
          targetPrice: alert.target_price,
          bookingLink: flight.link,
        });

        if (notified) {
          await supabase
            .from('flight_alerts')
            .update({ last_notified_price: flight.price })
            .eq('id', alert.id);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        results.push({
          alertId: alert.id,
          status: notified ? 'notified' : 'notification_failed',
          price: flight.price,
        });
      } else {
        results.push({ alertId: alert.id, status: 'checked', price: flight.price });
      }
    }

    return NextResponse.json({
      message: 'Cron executed successfully',
      processed: alerts.length,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}