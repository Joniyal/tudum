# Enable Voice Messages on Vercel

Voice messages work locally but require AWS S3 for production (Vercel has a read-only filesystem).

## Quick Setup (5 minutes)

### 1. Create AWS S3 Bucket
1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/buckets)
2. Click **Create bucket**
3. Name: `tudum-voice-messages` (or your preferred name)
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. **Uncheck** "Block all public access" (we need public read access for audio playback)
6. Click **Create bucket**

### 2. Configure Bucket Policy
1. Click on your bucket
2. Go to **Permissions** tab
3. Scroll to **Bucket policy**
4. Click **Edit** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tudum-voice-messages/voices/*"
    }
  ]
}
```

Replace `tudum-voice-messages` with your bucket name.

### 3. Create IAM User for Uploads
1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Add users**
3. Name: `tudum-uploader`
4. Select **Access key - Programmatic access**
5. Click **Next: Permissions**
6. Click **Attach existing policies directly**
7. Search and select: **AmazonS3FullAccess** (or create a custom policy with PutObject only)
8. Click **Next** through to **Create user**
9. **IMPORTANT**: Copy the Access Key ID and Secret Access Key (you won't see it again!)

### 4. Add Environment Variables to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (tudum)
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

| Name | Value | Environment |
|------|-------|-------------|
| `AWS_S3_BUCKET_NAME` | `tudum-voice-messages` | Production, Preview, Development |
| `AWS_ACCESS_KEY_ID` | Your Access Key ID from step 3 | Production, Preview, Development |
| `AWS_SECRET_ACCESS_KEY` | Your Secret Key from step 3 | Production, Preview, Development |
| `AWS_REGION` | `us-east-1` (or your region) | Production, Preview, Development |

5. Click **Save** for each

### 5. Redeploy
1. Go to **Deployments** tab in Vercel
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait ~2 minutes for deployment to complete

## Test It!
1. Go to your Vercel app URL
2. Navigate to Messages
3. Click the 🎤 microphone button
4. Record and send a voice message
5. ✅ The audio should upload to S3 and play back!

## Troubleshooting

### "Voice messages require S3 configuration" error
- Make sure all 4 environment variables are set in Vercel
- Redeploy after adding variables

### Upload works but audio doesn't play
- Check bucket policy allows public read access
- Verify the audio URL in browser inspector shows S3 URL

### "Access Denied" from S3
- Check IAM user has S3 write permissions
- Verify AWS credentials are correct in Vercel env vars

## Cost
- AWS S3 Free Tier: 5GB storage + 20,000 GET requests per month FREE
- Beyond that: ~$0.023/GB/month storage + $0.0004/1000 requests
- For a small app, expect **$0-2/month**

## Alternative: Skip S3 (Temporary)
If you want to skip S3 setup temporarily, voice messages will only work locally at `http://localhost:3000`.
