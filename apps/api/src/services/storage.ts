import { Storage } from '@google-cloud/storage';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

let storage: Storage | null = null;
let bucketName: string | null = null;

try {
  const credentialsBase64 = process.env.GCS_SERVICE_ACCOUNT_KEY;
  bucketName = process.env.GCS_BUCKET_NAME || null;

  if (credentialsBase64 && bucketName) {
    const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf8'));
    storage = new Storage({ credentials });
    logger.info('Google Cloud Storage initialized successfully.');
  } else {
    logger.warn('GCS coordinates not provided in .env (GCS_BUCKET_NAME or GCS_SERVICE_ACCOUNT_KEY). Streaming will fallback directly if enabled.');
  }
} catch (error) {
  logger.error('Failed to initialize Google Cloud Storage:', error);
}

/**
 * Generates a signed URL for a specific audio file in GCS.
 * @param fileName - The key/path of the file in the bucket (e.g., 'audio/song_uuid.mp3')
 * @param expiresInMinutes - Duration the URL is valid (default 30)
 * @returns The signed URL or null if storage is not configured properly.
 */
export const generateSignedUrl = async (fileName: string, expiresInMinutes: number = 30): Promise<string | null> => {
  if (!storage || !bucketName) return null;

  try {
    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    };

    const [url] = await storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl(options);

    return url;
  } catch (error) {
    logger.error(`Error generating signed URL for ${fileName}:`, error);
    return null;
  }
};
