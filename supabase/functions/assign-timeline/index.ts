import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignTimelineData {
  clientId: string;
  templateId: string;
  startDate: string; // ISO date string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'ADMIN') {
      throw new Error('Unauthorized - Admin access required');
    }

    const { clientId, templateId, startDate }: AssignTimelineData = await req.json();

    // Validate input
    if (!clientId || !templateId || !startDate) {
      throw new Error('All fields are required: clientId, templateId, startDate');
    }

    console.log(`Assigning timeline to client ${clientId} with template ${templateId} starting ${startDate}`);

    // Check if client already has an active timeline
    const { data: existingTimeline, error: timelineCheckError } = await supabaseClient
      .from('client_timelines')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (timelineCheckError) {
      throw new Error(`Error checking existing timeline: ${timelineCheckError.message}`);
    }

    if (existingTimeline && existingTimeline.length > 0) {
      throw new Error('Client already has an active timeline');
    }

    // Get the template details
    const { data: template, error: templateError } = await supabaseClient
      .from('timeline_templates')
      .select('name, duration_months')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateError?.message || 'Unknown error'}`);
    }

    // Calculate end date (start date + duration in months)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + template.duration_months);

    // Create the client timeline
    const { data: clientTimeline, error: timelineError } = await supabaseClient
      .from('client_timelines')
      .insert({
        client_id: clientId,
        template_id: templateId,
        name: template.name,
        start_date: startDate,
        end_date: end.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (timelineError || !clientTimeline) {
      throw new Error(`Failed to create client timeline: ${timelineError?.message || 'Unknown error'}`);
    }

    console.log(`Created client timeline with ID: ${clientTimeline.id}`);

    // Get all template items
    const { data: templateItems, error: itemsError } = await supabaseClient
      .from('timeline_template_items')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order');

    if (itemsError) {
      throw new Error(`Failed to fetch template items: ${itemsError.message}`);
    }

    if (!templateItems || templateItems.length === 0) {
      console.warn('No template items found for template:', templateId);
      return new Response(
        JSON.stringify({ 
          success: true, 
          timeline_id: clientTimeline.id,
          items_created: 0,
          message: 'Timeline created but no items found in template'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create timeline items based on template items
    const timelineItems = templateItems.map((templateItem, index) => {
      // Calculate due date based on display order and start date
      // For simplicity, we'll space items evenly across the duration
      const totalItems = templateItems.length;
      const totalDays = template.duration_months * 30; // Approximate days
      const dayOffset = Math.floor((totalDays / totalItems) * index);
      
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + dayOffset);

      return {
        client_timeline_id: clientTimeline.id,
        template_item_id: templateItem.id,
        title: templateItem.title,
        description: templateItem.description,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'PENDENTE' as const
      };
    });

    // Insert all timeline items
    const { error: insertItemsError } = await supabaseClient
      .from('timeline_items')
      .insert(timelineItems);

    if (insertItemsError) {
      console.error('Error creating timeline items:', insertItemsError);
      
      // Rollback: delete the timeline if items failed
      await supabaseClient
        .from('client_timelines')
        .delete()
        .eq('id', clientTimeline.id);
      
      throw new Error(`Failed to create timeline items: ${insertItemsError.message}`);
    }

    console.log(`Successfully created ${timelineItems.length} timeline items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        timeline_id: clientTimeline.id,
        items_created: timelineItems.length,
        start_date: startDate,
        end_date: end.toISOString().split('T')[0]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Assign timeline error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});