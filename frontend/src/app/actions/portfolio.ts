'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function createPortfolioAction(prevState: any, formData: FormData) {
  const name = formData.get('name');
  const description = formData.get('description');

  if (!name) {
    return { error: 'Nama portofolio wajib diisi' };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  try {
    const res = await fetch(`${API_URL}/portfolios`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, description }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Gagal membuat portofolio' };
    }
  } catch (error) {
    return { error: 'Koneksi ke server gagal' };
  }

  revalidatePath('/dashboard/portfolios');
  return { success: true };
}

export async function updatePortfolioAction(id: string, prevState: any, formData: FormData) {
  const name = formData.get('name');
  const description = formData.get('description');

  if (!name) {
    return { error: 'Nama portofolio wajib diisi' };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  try {
    const res = await fetch(`${API_URL}/portfolios/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, description }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Gagal mengubah portofolio' };
    }
  } catch (error) {
    return { error: 'Koneksi ke server gagal' };
  }

  revalidatePath('/dashboard/portfolios');
  return { success: true };
}

export async function deletePortfolioAction(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  try {
    const res = await fetch(`${API_URL}/portfolios/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Gagal menghapus portofolio' };
    }
  } catch (error) {
    return { error: 'Koneksi ke server gagal' };
  }

  revalidatePath('/dashboard/portfolios');
  return { success: true };
}
