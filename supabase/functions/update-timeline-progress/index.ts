import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Update timeline progress function called');

    const { timeline_item_id, progress_status, extra_points = 0 } = await req.json();

    if (!timeline_item_id || !progress_status) {
      throw new Error('timeline_item_id and progress_status are required');
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Updating timeline item:', timeline_item_id, 'to status:', progress_status);

    // Update timeline item progress status
    const { error: updateError } = await supabaseAdmin
      .from('timeline_items')
      .update({ progress_status })
      .eq('id', timeline_item_id);

    if (updateError) {
      throw updateError;
    }

    console.log('Timeline item updated successfully');

    // Get client_id from timeline item
    const { data: timelineItem, error: fetchError } = await supabaseAdmin
      .from('timeline_items')
      .select(`
        id,
        client_timeline_id,
        client_timelines!inner(client_id)
      `)
      .eq('id', timeline_item_id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const clientId = timelineItem.client_timelines.client_id;
    console.log('Found client ID:', clientId);

    // Calculate points based on progress status
    let pointsToAdd = 0;
    switch (progress_status) {
      case 'NO_PRAZO':
        pointsToAdd = 25;
        break;
      case 'ADIANTADO':
        pointsToAdd = 25 + (extra_points || 0);
        break;
      case 'ATRASADO':
        pointsToAdd = 0;
        break;
      default:
        pointsToAdd = 0;
    }

    console.log('Points to add:', pointsToAdd);

      // Update client points if any points to add
      if (pointsToAdd > 0) {
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('points')
          .eq('id', clientId)
          .single();

        const newPoints = (currentProfile?.points || 0) + pointsToAdd;

        const { error: directUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', clientId);

        if (directUpdateError) {
          throw directUpdateError;
        }

        // Insert into point history
        let reason = '';
        switch (progress_status) {
          case 'NO_PRAZO':
            reason = 'Tarefa Concluída no Prazo';
            break;
          case 'ADIANTADO':
            reason = 'Tarefa Concluída Adiantada';
            break;
        }

        const { error: historyError } = await supabaseAdmin
          .from('point_history')
          .insert({
            client_id: clientId,
            points_change: pointsToAdd,
            reason: reason
          });

        if (historyError) {
          console.error('Error inserting point history:', historyError);
          // Don't throw error, just log it as history is supplemental
        }

        console.log('Points updated successfully');
      }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Timeline item updated successfully. ${pointsToAdd} points added.`,
        pointsAdded: pointsToAdd
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in update-timeline-progress function:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to update timeline progress'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});