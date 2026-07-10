export default async (request, context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    const body = await request.json();
    const { amount, description, email } = body;
    const idempotencyKey = `pix-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer APP_USR-5157370925290787-032011-1244653d6530ab379537bd6f716976f7-280858278',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(amount),
        description: String(description).substring(0, 255),
        payment_method_id: 'pix',
        payer: { email: email || 'cliente@bancadamatriz.com.br' }
      })
    });

    const data = await mpRes.json();
    const txData = data?.point_of_interaction?.transaction_data;

    if (txData?.qr_code_base64) {
      return new Response(JSON.stringify({
        qr_code: txData.qr_code,
        qr_code_base64: txData.qr_code_base64,
        payment_id: data.id,
        status: data.status
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } else {
      return new Response(JSON.stringify({ error: data.message || 'QR nao gerado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/pix' };
