import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseStorageProvider } from './firebase-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { STORAGE_PROVIDER } from './storage.tokens';

export const storageProviderFactory: Provider = {
  provide: STORAGE_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const provider = (configService.get<string>('STORAGE_PROVIDER') ?? 'local').toLowerCase();

    if (provider === 'firebase') {
      const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
      const bucketName = configService.get<string>('FIREBASE_STORAGE_BUCKET');
      const rawPrivateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
      const privateKey = rawPrivateKey?.replace(/\\n/g, '\n');
      const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const serviceAccountB64 = configService.get<string>('FIREBASE_SERVICE_ACCOUNT_B64');
      let serviceAccountJson = configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
      const googleApplicationCredentials = configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

      if (!projectId) {
        throw new Error('Firebase Storage: FIREBASE_PROJECT_ID nao configurado.');
      }

      if (!bucketName) {
        throw new Error('Firebase Storage: FIREBASE_STORAGE_BUCKET nao configurado.');
      }

      if (!serviceAccountJson && serviceAccountB64) {
        try {
          serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf8');
        } catch {
          throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 invalido: nao foi possivel decodificar Base64');
        }
      }

      const hasJsonCredential = Boolean(serviceAccountJson);
      const hasInlinePairCredential = Boolean(clientEmail && privateKey);
      const hasAdcCredential = Boolean(googleApplicationCredentials);

      if (!hasJsonCredential && !hasInlinePairCredential && !hasAdcCredential) {
        throw new Error(
          'Firebase Storage: credenciais ausentes. Configure uma opcao: FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_B64, FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, ou GOOGLE_APPLICATION_CREDENTIALS.',
        );
      }

      return new FirebaseStorageProvider({
        bucketName,
        projectId,
        clientEmail,
        privateKey,
        serviceAccountJson,
      });
    }

    if (provider === 's3') {
      return new S3StorageProvider({
        bucketName: configService.get<string>('S3_BUCKET_NAME') ?? '',
        region: configService.get<string>('S3_REGION') ?? '',
        accessKeyId: configService.get<string>('S3_ACCESS_KEY_ID') ?? '',
        secretAccessKey: configService.get<string>('S3_SECRET_ACCESS_KEY') ?? '',
        endpoint: configService.get<string>('S3_ENDPOINT'),
        publicBaseUrl: configService.get<string>('S3_PUBLIC_BASE_URL'),
        forcePathStyle: (configService.get<string>('S3_FORCE_PATH_STYLE') ?? 'false').toLowerCase() === 'true',
      });
    }

    if (provider !== 'local') {
      throw new Error(
        `Storage provider "${provider}" nao suportado. Use STORAGE_PROVIDER=local, firebase ou s3.`,
      );
    }

    const port = configService.get<string>('PORT') ?? '3000';
    const publicBaseUrl = (configService.get<string>('STORAGE_PUBLIC_BASE_URL') ?? `http://localhost:${port}`).replace(/\/$/, '');
    const rootPath = configService.get<string>('STORAGE_LOCAL_ROOT_PATH') ?? 'uploads';

    return new LocalStorageProvider({
      rootPath,
      publicBaseUrl,
    });
  },
};
