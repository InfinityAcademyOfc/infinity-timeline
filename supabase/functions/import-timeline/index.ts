import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimelineItem {
  title: string;
  description?: string;
  category: 'FASE' | 'MES' | 'ENTREGAVEL';
  display_order: number;
  parent_id?: string;
}

interface ParsedTimeline {
  name: string;
  duration: number;
  items: TimelineItem[];
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

    const { name, duration, items }: ParsedTimeline = await req.json();

    // Validate input
    if (!name || !duration || !items || items.length === 0) {
      throw new Error('Invalid timeline data: name, duration and items are required');
    }

    console.log(`Importing timeline: ${name} with ${items.length} items`);

    // Start a transaction by creating the template first
    const { data: template, error: templateError } = await supabaseClient
      .from('timeline_templates')
      .insert({
        name,
        duration_months: duration,
        description: `Imported timeline with ${items.length} items`
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      throw new Error(`Failed to create template: ${templateError.message}`);
    }

    console.log(`Created template with ID: ${template.id}`);

    // Now insert all the items
    const templateItems = items.map(item => ({
      template_id: template.id,
      title: item.title,
      description: item.description || null,
      category: item.category,
      display_order: item.display_order,
      parent_id: item.parent_id || null
    }));

    const { error: itemsError } = await supabaseClient
      .from('timeline_template_items')
      .insert(templateItems);

    if (itemsError) {
      console.error('Error creating template items:', itemsError);
      
      // Rollback: delete the template if items failed
      await supabaseClient
        .from('timeline_templates')
        .delete()
        .eq('id', template.id);
      
      throw new Error(`Failed to create template items: ${itemsError.message}`);
    }

    console.log(`Successfully imported ${templateItems.length} items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        template_id: template.id,
        items_count: templateItems.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Import timeline error:', error);
    
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