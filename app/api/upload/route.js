// Keep same logic as original api/upload.js — just ported to Next.js App Router format
export async function POST(request) {
  const { filename, contentType } = await request.json();

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'portfolio-media';

  // Same presigned URL generation as original Vercel function
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return Response.json({
    url: signedUrl,
    headers: { 'Content-Type': contentType },
  });
}
