import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Auth failed: No Bearer token provided');
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'undefined' || token === 'null') {
      console.error('Auth failed: Token is undefined or null');
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth error in middleware:', error?.message || 'No user found for token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error('Auth middleware exception:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
