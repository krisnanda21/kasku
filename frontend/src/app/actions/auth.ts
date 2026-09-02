'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Gagal login' };
    }

    const cookieStore = await cookies();
    cookieStore.set('jwt', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 72 * 60 * 60, // 72 hours matching Go backend
    });

  } catch (error) {
    return { error: 'Koneksi ke server gagal' };
  }

  redirect('/dashboard');
}

export async function registerAction(prevState: any, formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');

  if (!name || !email || !password) {
    return { error: 'Semua field wajib diisi' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Gagal mendaftar' };
    }
  } catch (error) {
    return { error: 'Koneksi ke server gagal' };
  }

  redirect('/login');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('jwt');
  redirect('/login');
}
