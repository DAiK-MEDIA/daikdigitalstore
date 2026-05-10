import { supabase } from '../services/supabase';

/**
 * Generates a random 7-digit numeric string.
 */
const generate7DigitId = (): string => {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
};

/**
 * Generates a unique 7-digit order reference by checking against the database.
 */
export const generateUniqueOrderRef = async (): Promise<string> => {
  let isUnique = false;
  let orderRef = '';

  while (!isUnique) {
    orderRef = generate7DigitId();
    const { data, error } = await supabase
      .from('orders')
      .select('order_ref')
      .eq('order_ref', orderRef)
      .single();

    if (error || !data) {
      isUnique = true;
    }
  }

  return orderRef;
};
