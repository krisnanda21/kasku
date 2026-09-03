'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function createTransactionAction(prevState: any, formData: FormData) {
  const portfolio_id = formData.get('portfolio_id');
  const type = formData.get('type');
  const rawAmount = formData.get('amount') as string;
  const description = formData.get('description');
  let category_id = formData.get('category_id');
  const custom_category_name = formData.get('custom_category_name');
  const date = formData.get('date');

  // Strip non-digits and parse to number
  const amount = Number(rawAmount.replace(/\D/g, ''));

  if (!amount || amount <= 0) {
    return { error: 'Jumlah transaksi tidak valid' };
  }
  if (!category_id) {
    return { error: 'Kategori wajib dipilih' };
  }
  if (!date) {
    return { error: 'Tanggal transaksi wajib diisi' };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  try {
    // Handle custom category
    if (category_id === 'custom') {
      if (!custom_category_name) return { error: 'Nama kategori baru wajib diisi' };
      const catRes = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: custom_category_name, type })
      });
      if (!catRes.ok) {
        return { error: 'Gagal membuat kategori baru' };
      }
      const catData = await catRes.json();
      category_id = catData.data.id;
    }

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
        category_id,
        date: new Date(date as string).toISOString()
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
