import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/efsf9n3n5vco1t2zbjcg4xlileflcmnn";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Forwarding order to Make.com:", JSON.stringify(payload));

    const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await makeResponse.text();
    console.log("Make.com response:", makeResponse.status, responseText);

    if (!makeResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Make.com failed: ${makeResponse.status}`, detail: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
