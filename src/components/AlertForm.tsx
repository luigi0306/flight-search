'use client';

import { useState } from 'react';
import { createAlert } from '@/app/actions';
import { useRouter } from 'next/navigation';

export function AlertForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const result = await createAlert(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <p className="text-green-700 font-medium">Alerta cadastrado com sucesso!</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-green-600 hover:underline"
        >
          Cadastrar outro alerta
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Origem (IATA)
          </label>
          <input
            name="origin"
            type="text"
            maxLength={3}
            required
            placeholder="BSB"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destino (IATA)
          </label>
          <input
            name="destination"
            type="text"
            maxLength={3}
            required
            placeholder="GRU"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Ida
          </label>
          <input
            name="departure_date"
            type="date"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Volta (opcional)
          </label>
          <input
            name="return_date"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preço Alvo (R$)
        </label>
        <input
          name="target_price"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="400.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar Alerta'}
      </button>
    </form>
  );
}