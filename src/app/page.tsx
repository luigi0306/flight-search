import { getSupabaseClient } from '@/lib/supabase';
import { checkUrlAuth } from './auth';
import { AlertForm } from '@/components/AlertForm';
import { LoginForm } from '@/components/LoginForm';

interface FlightAlert {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  target_price: number;
  is_active: boolean;
  created_at: string;
}

async function getAlerts() {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('flight_alerts')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as FlightAlert[]) || [];
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const isAuthenticated = await checkUrlAuth(params.key || '');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold text-center mb-6">
            Flight Tracker
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Digite a chave de acesso
          </p>
          <LoginForm />
        </div>
      </div>
    );
  }

  const alerts = await getAlerts();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Flight Tracker
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Meus Alertas
            </h2>
            
            {alerts.length === 0 ? (
              <div className="p-8 bg-white rounded-lg shadow-sm text-center">
                <p className="text-gray-500 mb-2">Nenhum alerta cadastrado</p>
                <p className="text-sm text-gray-400">
                  Use o formulário ao lado para criar o primeiro
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {alert.origin}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold text-gray-900">
                          {alert.destination}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {alert.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Ida: {alert.departure_date.split('-').reverse().join('/')}</p>
                      {alert.return_date && (
                        <p>Volta: {alert.return_date.split('-').reverse().join('/')}</p>
                      )}
                      <p className="mt-1 font-medium">
                        Alvo: R$ {alert.target_price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Novo Alerta
            </h2>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <AlertForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}