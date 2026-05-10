import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import bcrypt from 'bcrypt';

export const verifyAgentPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const { data: setting, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'agent_password_hash')
      .single();

    if (error || !setting) {
      return res.status(500).json({ error: 'Agent password not configured' });
    }

    const isMatch = await bcrypt.compare(password, setting.value);

    if (isMatch) {
      res.json({ success: true, message: 'Access granted' });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect password' });
    }
  } catch (error: any) {
    console.error('Error verifying agent password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
