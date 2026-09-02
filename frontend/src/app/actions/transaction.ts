'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function createTransactionAction(prevState: any, formData: FormData) {
  const portfolio_id = formData.get('portfolio_id');
  const type = formData.get('type');
  const amount = Number(formData.get('amount'));
  const description = formData.get('description');

  if (!amount || amount <= 0) {
    return { error: 'Jumlah transaksi tidak valid' };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  try {
    const res = await fetch(`${API_URL}/portfolios/${portfolio_id}/transactions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type,
        amount,
        description,
        category_id: null // Untuk versi MVP sederhana, kategori tidak wajib
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Gagal menyimpan transaksi' };
    }
  } catch (error) {
    return { error: 'Koneksi ke server gagal' };
  }

  redirect(`/dashboard/portfolios/${portfolio_id}/transactions`);
}
