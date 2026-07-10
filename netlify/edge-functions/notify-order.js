export default async (request) => {
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
    const { orderId, productName, price, custPhone, custEmail, tipoEntrega } = await request.json();

    const priceStr = parseFloat(price).toFixed(2).replace('.', ',');
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Salvar notificação no Firestore para o painel admin ver em tempo real
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/bancadamatriz-9f797/databases/(default)/documents/notifications`;

    await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          orderId: { stringValue: orderId },
          productName: { stringValue: productName },
          price: { doubleValue: parseFloat(price) },
          custPhone: { stringValue: custPhone },
          custEmail: { stringValue: custEmail },
          tipoEntrega: { stringValue: tipoEntrega },
          status: { stringValue: 'novo_pedido' },
          lida: { booleanValue: false },
          createdAt: { stringValue: now }
        }
      })
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/notify-order' };
