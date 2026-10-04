import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { token, title, body, data } = await req.json()

    // Validate required fields
    if (!token || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = Deno.env.get('FIREBASE_ACCESS_TOKEN')
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID')

    if (!accessToken || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing Firebase credentials. Set FIREBASE_ACCESS_TOKEN and FIREBASE_PROJECT_ID in Edge Function environment.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Firebase Cloud Messaging HTTP v1 API
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title,
              body,
            },
            webpush: {
              fcm_options: {
                link: data?.url || '/'
              },
              notification: {
                icon: '/icon-192.png',
                badge: '/icon-192.png',
              }
            },
            data: data || {}
          }
        })
      }
    )

    const fcmData = await fcmResponse.json()

    if (!fcmResponse.ok) {
      console.error('FCM Error:', fcmData)
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: fcmData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageId: fcmData.name }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
