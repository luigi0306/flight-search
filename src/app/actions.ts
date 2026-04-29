'use server';

import { getSupabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createAlert(data: unknown) {
  console.log('[createAlert] Received data:', data);
  
  if (!(data instanceof FormData)) {
    console.error('[createAlert] Data is not FormData:', typeof data);
    return { error: 'Dados inválidos' };
  }

  const origin = data.get('origin')?.toString().toUpperCase().trim();
  const destination = data.get('destination')?.toString().toUpperCase().trim();
  const rawDeparture = String(data.get('departure_date') || '').split('T')[0].trim();
  const rawReturn = data.get('return_date') ? String(data.get('return_date')).split('T')[0].trim() : null;
  const target_price = parseFloat(data.get('target_price')?.toString() || '0');

  const departure_date = rawDeparture || null;
  const return_date = rawReturn;

  console.log('[createAlert] Parsed fields:', { origin, destination, departure_date, return_date, target_price });

  if (!origin || !destination || !departure_date || !target_price) {
    return { error: 'Preencha todos os campos obrigatórios' };
  }

  if (origin.length !== 3 || destination.length !== 3) {
    return { error: 'Código IATA deve ter 3 letras' };
  }

  try {
    const supabase = getSupabaseClient();
    console.log('[createAlert] Inserting into flight_alerts...');

    const { error: insertError } = await supabase
      .from('flight_alerts')
      .insert({
        origin,
        destination,
        departure_date,
        return_date,
        target_price,
        is_active: true,
      });

    if (insertError) {
      console.error('[createAlert] Insert error:', insertError);
      return { error: insertError.message };
    }

    console.log('[createAlert] Success!');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[createAlert] Server action error:', err);
    return { error: 'Erro interno do servidor' };
  }
}