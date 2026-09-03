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

export async function toggleInvitationAction(portfolioId: string, token: string) {
	const cookieStore = await cookies();
	const jwtToken = cookieStore.get('jwt')?.value;

	try {
		const res = await fetch(`${API_URL}/portfolios/${portfolioId}/invitations/${token}/toggle`, {
			method: 'PATCH',
			headers: { 
				'Authorization': `Bearer ${jwtToken}`
			},
		});

		const data = await res.json();
		if (!res.ok) return { error: data.error || 'Gagal mengubah status link' };
	} catch (error) {
		return { error: 'Koneksi ke server gagal' };
	}

	revalidatePath(`/dashboard/portfolios/${portfolioId}/transactions`);
	return { success: true };
}

export async function updateInvitationRoleAction(portfolioId: string, token: string, role: string) {
	const cookieStore = await cookies();
	const jwtToken = cookieStore.get('jwt')?.value;

	try {
		const res = await fetch(`${API_URL}/portfolios/${portfolioId}/invitations/${token}/role`, {
			method: 'PATCH',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${jwtToken}`
			},
			body: JSON.stringify({ role }),
		});

		const data = await res.json();
		if (!res.ok) return { error: data.error || 'Gagal mengubah role link' };
	} catch (error) {
		return { error: 'Koneksi ke server gagal' };
	}

	revalidatePath(`/dashboard/portfolios/${portfolioId}/transactions`);
	return { success: true };
}

export async function regenerateInvitationAction(portfolioId: string) {
	const cookieStore = await cookies();
	const jwtToken = cookieStore.get('jwt')?.value;

	try {
		const res = await fetch(`${API_URL}/portfolios/${portfolioId}/invitations/regenerate`, {
			method: 'POST',
			headers: { 
				'Authorization': `Bearer ${jwtToken}`
			},
		});

		const data = await res.json();
		if (!res.ok) return { error: data.error || 'Gagal regenerate link' };
	} catch (error) {
		return { error: 'Koneksi ke server gagal' };
	}

	revalidatePath(`/dashboard/portfolios/${portfolioId}/transactions`);
	return { success: true };
}

export async function removeMemberAction(portfolioId: string, userId: string) {
	const cookieStore = await cookies();
	const jwtToken = cookieStore.get('jwt')?.value;

	try {
		const res = await fetch(`${API_URL}/portfolios/${portfolioId}/members/${userId}`, {
			method: 'DELETE',
			headers: { 
				'Authorization': `Bearer ${jwtToken}`
			},
		});

		const data = await res.json();
		if (!res.ok) return { error: data.error || 'Gagal menghapus anggota' };
	} catch (error) {
		return { error: 'Koneksi ke server gagal' };
	}

	revalidatePath(`/dashboard/portfolios/${portfolioId}/transactions`);
	return { success: true };
}

export async function joinPortfolioAction(token: string) {
	const cookieStore = await cookies();
	const jwtToken = cookieStore.get('jwt')?.value;

	try {
		const res = await fetch(`${API_URL}/invitations/join`, {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${jwtToken}`
			},
			body: JSON.stringify({ token }),
		});

		const data = await res.json();
		if (!res.ok) return { error: data.error || 'Gagal bergabung' };
		return { success: true, portfolio_id: data.portfolio_id };
	} catch (error) {
		return { error: 'Koneksi ke server gagal' };
	}
}

export async function getInvitationAction(portfolioId: string) {
	const cookieStore = await cookies();
	const jwtToken = cookieStore.get('jwt')?.value;

	try {
		const res = await fetch(`${API_URL}/portfolios/${portfolioId}/invitations`, {
			headers: { 'Authorization': `Bearer ${jwtToken}` },
			cache: 'no-store'
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data.data;
	} catch (error) {
		return null;
	}
}

export async function getMembersAction(portfolioId: string) {
	const cookieStore = await cookies();
	const jwtToken = cookieStore.get('jwt')?.value;

	try {
		const res = await fetch(`${API_URL}/portfolios/${portfolioId}/members`, {
			headers: { 'Authorization': `Bearer ${jwtToken}` },
			cache: 'no-store'
		});
		if (!res.ok) return [];
		const data = await res.json();
		return data.data || [];
	} catch (error) {
		return [];
	}
}
