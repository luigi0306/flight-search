interface TelegramNotificationParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  priceFound: number;
  targetPrice: number;
  bookingLink: string;
}

export async function sendTelegramNotification(
  params: TelegramNotificationParams
): Promise<boolean> {
  const { origin, destination, departureDate, returnDate, priceFound, targetPrice, bookingLink } = params;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured');
    return false;
  }

  const formatDate = (dateStr: string) => dateStr.split('T')[0].split('-').reverse().join('/');
  const formattedDeparture = formatDate(departureDate);
  const formattedReturn = returnDate ? ` | Volta: ${formatDate(returnDate)}` : '';

  const safeLink = bookingLink.replace(/&/g, '&amp;');

  const message = `🚨 ALERTA DE PASSAGEM!
🛫 ${origin} ➡️ ${destination}
📅 Ida: ${formattedDeparture}${formattedReturn}
💰 Preço Atual: R$ ${priceFound.toFixed(2).replace('.', ',')} (Seu Alvo: R$ ${targetPrice.toFixed(2).replace('.', ',')})
🔗 ${safeLink}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}