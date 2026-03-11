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

export async function deductCredits(userId: string, action: string, metadata?: any) {
  const cost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] || 1;

  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ 
      credits: supabase.raw('credits - ?', [cost]),
      used_credits: supabase.raw('used_credits + ?', [cost])
    })
    .eq('user_id', userId);

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
