import { basename, resolve } from 'node:path';

export function resolveUploadStaticConfig(uploadDir: string | undefined): {
  rootPath: string;
  routePath: string;
} {
  const normalizedUploadDir = uploadDir?.trim() || './uploads';
  const rootPath = resolve(normalizedUploadDir);
  const routePath = `/${basename(rootPath)}`;

  return {
    rootPath,
    routePath,
  };
}
