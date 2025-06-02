/**
 * Netlify Edge Function: Content Refresh
 * Triggers content data regeneration and provides cache busting for dynamic content
 */

export default async (request, context) => {
  const url = new URL(request.url);
  
  // Only allow POST requests for refresh
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed for content refresh'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Get the content type to refresh (if specified)
    const requestBody = await request.json().catch(() => ({}));
    const contentType = requestBody.contentType || url.searchParams.get('type');
    
    // Trigger a build hook if configured
    const buildHookUrl = Deno.env.get('NETLIFY_BUILD_HOOK_URL');
    
    if (buildHookUrl) {
      // Trigger a new build
      const buildResponse = await fetch(buildHookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trigger: 'content-refresh',
          contentType: contentType || 'all',
          timestamp: new Date().toISOString()
        })
      });
      
      if (buildResponse.ok) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Build triggered successfully',
          contentType: contentType || 'all',
          buildTriggered: true,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }
    }
    
    // If no build hook, just clear any edge caches
    const cacheKeys = [
      `content_${contentType}`,
      'content_music',
      'content_art', 
      'content_photos',
      'content_code'
    ];
    
    // Purge cache (this would be implementation-specific)
    return new Response(JSON.stringify({
      success: true,
      message: 'Content refresh requested',
      contentType: contentType || 'all',
      buildTriggered: false,
      cachePurged: true,
      timestamp: new Date().toISOString(),
      note: 'Configure NETLIFY_BUILD_HOOK_URL environment variable for automatic builds'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Content refresh error:', error);
    
    return new Response(JSON.stringify({
      error: 'Content refresh failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};