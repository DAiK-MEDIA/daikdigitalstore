import { Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const getPlans = async (req: Request, res: Response) => {
  try {
    const { type } = req.query; // 'client' or 'agent'
    
    const { data, error } = await supabase
      .from('data_plans')
      .select('*')
      .eq('is_active', true)
      .order('size_gb', { ascending: true });

    if (error) throw error;

    // Filter and map prices based on user type
    const formattedPlans = data.map(plan => ({
      id: plan.id,
      size_label: plan.size_label,
      size_gb: plan.size_gb,
      price: type === 'agent' ? plan.agent_price : plan.client_price,
    }));

    res.json(formattedPlans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};
