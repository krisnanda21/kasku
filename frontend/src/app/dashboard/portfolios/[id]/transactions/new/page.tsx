import { cookies } from 'next/headers';
import TransactionForm from './TransactionForm';

async function getCategories(portfolioId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  if (!token) return [];

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/categories?portfolio_id=${portfolioId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function NewTransactionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const categories = await getCategories(params.id);
  
  return <TransactionForm portfolioId={params.id} categories={categories} />;
}
