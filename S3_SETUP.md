# S3 Setup for Voice Messages

## Overview
This application supports storing voice messages in AWS S3 for production deployments. Voice messages will continue to work with local storage when S3 is not configured, making it perfect for development.

## Configuration

### Step 1: Create an S3 Bucket
1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Choose a bucket name (e.g., `tudum-voice-messages`)
4. Select your preferred region (e.g., `us-east-1`)
5. **Important**: Uncheck "Block all public access" if you want the audio files to be publicly accessible (or set up CloudFront for private access)
6. Click "Create bucket"

### Step 2: Create IAM User with S3 Permissions
1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Enter username (e.g., `tudum-s3-user`)
4. Click "Next"
5. Click "Attach policies directly"
6. Search for and select `AmazonS3FullAccess` (or create a more restrictive inline policy)
7. Click "Create user"
8. Go to "Security credentials" tab
9. Create access key (for programmatic access)
10. Copy the Access Key ID and Secret Access Key

### Step 3: Set Environment Variables
Add these to your `.env.local`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=tudum-voice-messages
AWS_S3_URL=https://tudum-voice-messages.s3.us-east-1.amazonaws.com
```

Or for production (Vercel), add these to your project settings → Environment Variables.

### Step 4: Test
1. Start the app
2. Open the Messages page
3. Record and send a voice message
4. Check your S3 bucket—you should see files under `voices/` folder

## Fallback Behavior
- If `AWS_S3_BUCKET_NAME` is not set, the app uses local filesystem storage (`public/uploads/voices/`)
- Perfect for development without AWS setup
- Voice messages uploaded to local storage persist in `public/uploads/` directory

## Optional: CloudFront CDN (Advanced)
For better performance and private file access:
1. Create a CloudFront distribution pointing to your S3 bucket
2. Set `AWS_S3_URL` to your CloudFront domain
3. Files will be served through the CDN instead of direct S3 URLs

## Troubleshooting

### "Failed to upload to S3" Error
- Verify `AWS_S3_BUCKET_NAME` is set
- Check IAM credentials are correct
- Ensure IAM user has S3 permissions
- Verify bucket allows public access (or configure via CloudFront)

### Files Still Going to Local Storage
- `AWS_S3_BUCKET_NAME` environment variable must be set for S3 to activate
- Check logs: `console.log` shows whether S3 or local storage is being used

### CORS Issues (when accessing from browser)
- Go to S3 bucket settings
- Set up CORS configuration to allow your domain
- Example CORS policy:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```
