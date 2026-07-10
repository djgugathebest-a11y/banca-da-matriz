const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { orderId, product, phone, email } = JSON.parse(event.body);
  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;

  const preference = {
    items: [{
      id: String(product.id || orderId),
      title: product.name || product.title,
      quantity: 1,
      unit_price: parseFloat(product.price),
      currency_id: 'BRL'
    }],
    payer: {
      email: email,
      phone: { number: phone }
    },
    external_reference: orderId,
    notification_url: 'https://bancadamatriz.com.br/.netlify/functions/mp-webhook',
    back_urls: {
      success: 'https://bancadamatriz.com.br/?status=success&order=' + orderId,
      failure: 'https://bancadamatriz.com.br/?status=failure&order=' + orderId,
      pending: 'https://bancadamatriz.com.br/?status=pending&order=' + orderId
    },
    auto_return: 'approved'
  };

  return new Promise((resolve) => {
    const body = JSON.stringify(preference);
    const options = {
      hostname: 'api.mercadopago.com',
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + MP_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ init_point: parsed.init_point, id: parsed.id })
          });
        } catch(e) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'Parse error' }) });
        }
      });
    });
    req.on('error', (e) => resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) }));
    req.write(body);
    req.end();
  });
};
