import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const testEnvPath = resolve(process.cwd(), '.env.test');

if (existsSync(testEnvPath)) {
  config({ path: testEnvPath, override: false });
} else {
  config({ override: false });
}
