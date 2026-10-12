const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not configured for this Edge Function.");
    return respond({ error: "Payment service is not configured." }, 500);
  }

  try {
    const body = await request.json();
    const origin = request.headers.get("origin");

    if (body.action === "initialize") {
      const amount = Number(body.amount);
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const callbackUrl = typeof body.callback_url === "string" ? body.callback_url : "";
      let callback: URL;

      try {
        callback = new URL(callbackUrl);
      } catch {
        return respond({ error: "A valid payment return URL is required." }, 400);
      }

      if (
        !email ||
        !Number.isSafeInteger(amount) ||
        amount <= 0 ||
        body.currency !== "NGN" ||
        !origin ||
        callback.origin !== origin ||
        callback.pathname !== "/payment"
      ) {
        return respond({ error: "Invalid payment details." }, 400);
      }

      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          currency: "NGN",
          callback_url: callback.toString(),
          metadata: body.metadata,
        }),
      });
      const result = await paystackResponse.json();

      if (!paystackResponse.ok || !result.status || !result.data?.authorization_url || !result.data?.reference) {
        console.error("Paystack transaction initialization failed:", result.message || paystackResponse.status);
        return respond({ error: "Paystack could not start this payment. Please try again." }, 502);
      }

      return respond({
        authorization_url: result.data.authorization_url,
        reference: result.data.reference,
      });
    }

    if (body.action === "verify") {
      const reference = typeof body.reference === "string" ? body.reference.trim() : "";
      if (!reference || reference.length > 100) {
        return respond({ error: "A valid payment reference is required." }, 400);
      }

      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      const result = await paystackResponse.json();

      if (!paystackResponse.ok || !result.status || !result.data) {
        console.error("Paystack transaction verification failed:", result.message || paystackResponse.status);
        return respond({ error: "Could not verify this payment with Paystack." }, 502);
      }

      return respond({
        reference: result.data.reference,
        status: result.data.status,
        amount: result.data.amount,
        currency: result.data.currency,
        email: result.data.customer?.email,
      });
    }

    return respond({ error: "Unsupported payment action." }, 400);
  } catch (error) {
    console.error("Paystack checkout function failed:", error);
    return respond({ error: "Payment service request failed." }, 500);
  }
});
