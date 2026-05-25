export async function POST(request) {
  const { filename, contentType } = await request.json();
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'portfolio-media';
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${bucket}/${filename}`;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}`;
  const amzDate = `${dateStamp}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  async function sha256(msg) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  async function hmac(key, msg) {
    const k = typeof key === 'string' ? new TextEncoder().encode(key) : key;
    const ck = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(msg)));
  }
  const toHex = buf => Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('');
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalRequest = ['PUT',`/${bucket}/${filename}`,'',canonicalHeaders,signedHeaders,payloadHash].join('\n');
  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = ['AWS4-HMAC-SHA256',amzDate,credentialScope,hashedCanonical].join('\n');
  const kDate = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return Response.json({ url, headers: { 'Authorization': authorization, 'Content-Type': contentType, 'x-amz-date': amzDate, 'x-amz-content-sha256': payloadHash } });
}
