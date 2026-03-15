import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

const CREDIT_COSTS = {
  'create-episode': 10,
  'regenerate-scene': 2,
  'custom-voice': 5
};

export async function checkCredits(userId: string, action: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    logger.error({ error, userId }, 'Failed to check credits');
    return false;
  }

  const cost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] || 1;
  return data.credits >= cost;
}

export async function deductCredits(userId: string, action: string, metadata?: Record<string, unknown>) {
  const cost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] || 1;

  // Use RPC for atomic credit deduction
  const { error: updateError } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_cost: cost
  });
  
  // Fallback: simple update (may have race conditions)
  if (updateError) {
    const { data: current } = await supabase
      .from('user_credits')
      .select('credits, used_credits')
      .eq('user_id', userId)
      .single();
      
    if (current) {
      await supabase
        .from('user_credits')
        .update({ 
          credits: current.credits - cost,
          used_credits: (current.used_credits || 0) + cost
        })
        .eq('user_id', userId);
    }
  }

  if (updateError) {
    logger.error({ updateError, userId }, 'Failed to deduct credits');
    throw updateError;
  }

  await supabase.from('usage_logs').insert({
    user_id: userId,
    action,
    credits_used: cost,
    metadata
  });

  logger.info({ userId, action, cost }, 'Credits deducted');
}
