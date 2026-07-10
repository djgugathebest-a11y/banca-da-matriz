const https = require('https');

const FIREBASE_PROJECT = 'bancadamatriz-9f797';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 200, body: 'OK' };

  const body = JSON.parse(event.body || '{}');

  if (body.type === 'payment' && body.data && body.data.id) {
    const paymentId = body.data.id;
    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;

    const payment = await fetchMP('/v1/payments/' + paymentId, MP_TOKEN);

    if (payment.status === 'approved') {
      const orderId = payment.external_reference;
      await updateOrderStatus(orderId, paymentId);
    }
  }

  return { statusCode: 200, body: 'OK' };
};

function fetchMP(path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.mercadopago.com',
      path: path,
      headers: { 'Authorization': 'Bearer ' + token }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({}); }
      });
    }).on('error', () => resolve({}));
  });
}

async function updateOrderStatus(orderId, paymentId) {
  const path = '/v1/projects/' + FIREBASE_PROJECT +
    '/databases/(default)/documents/orders/' + orderId +
    '?updateMask.fieldPaths=status&updateMask.fieldPaths=paymentId&updateMask.fieldPaths=paidAt';

  const body = JSON.stringify({
    fields: {
      status: { stringValue: 'pago' },
      paymentId: { stringValue: String(paymentId) },
      paidAt: { stringValue: new Date().toISOString() }
    }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: path,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', resolve);
    req.write(body);
    req.end();
  });
}
