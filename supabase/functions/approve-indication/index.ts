import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { indication_id } = await req.json();
    
    console.log('Approving indication:', indication_id);

    // Get indication details
    const { data: indication, error: indicationError } = await supabase
      .from('indications')
      .select('client_id, status')
      .eq('id', indication_id)
      .single();

    if (indicationError) {
      console.error('Error fetching indication:', indicationError);
      throw indicationError;
    }

    if (!indication) {
      throw new Error('Indication not found');
    }

    if (indication.status !== 'PENDENTE') {
      throw new Error('Indication is not pending');
    }

    // Get client's current points and monthly fee
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, monthly_fee')
      .eq('id', indication.client_id)
      .single();

    if (profileError) {
      console.error('Error fetching client profile:', profileError);
      throw profileError;
    }

    const currentPoints = profile?.points || 0;
    const monthlyFee = profile?.monthly_fee || 0;
    
    // Calculate 25% of the monthly fee as points
    const pointsToAdd = Math.floor(monthlyFee * 0.25);
    
    console.log(`Awarding ${pointsToAdd} points (25% of monthly fee: ${monthlyFee})`);

    // Update indication status
    const { error: updateError } = await supabase
      .from('indications')
      .update({ 
        status: 'CONCLUIDO',
        points_awarded: pointsToAdd
      })
      .eq('id', indication_id);

    if (updateError) {
      console.error('Error updating indication:', updateError);
      throw updateError;
    }

    // Update client points
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({ 
        points: currentPoints + pointsToAdd 
      })
      .eq('id', indication.client_id);

    if (pointsError) {
      console.error('Error updating points:', pointsError);
      throw pointsError;
    }

    // Insert into point history
    const { error: historyError } = await supabase
      .from('point_history')
      .insert({
        client_id: indication.client_id,
        points_change: pointsToAdd,
        reason: 'Indicação Aprovada'
      });

    if (historyError) {
      console.error('Error inserting point history:', historyError);
      throw historyError;
    }

    console.log('Indication approved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Indicação aprovada com sucesso',
        points_awarded: pointsToAdd
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in approve-indication function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});