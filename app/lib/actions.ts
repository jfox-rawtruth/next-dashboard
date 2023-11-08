'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@vercel/postgres';
import { z } from 'zod';

const InvoiceSchema = z.object({
  amount: z.coerce.number(),
  customerId: z.string(),
  date: z.string(),
  id: z.string(),
  status: z.enum(['pending', 'paid']),
});

const CreateInvoice = InvoiceSchema.omit({
  date: true,
  id: true,
});

const UpdateInvoice = InvoiceSchema.omit({
  date: true,
  id: true,
});

export async function createInvoice(formData: FormData) {
  const { amount, customerId, status } = CreateInvoice.parse({
    amount: formData.get('amount'),
    customerId: formData.get('customerId'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
