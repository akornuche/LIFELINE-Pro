import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const base = require('./package.json').jest;
export default { ...base, extensionsToTreatAsEsm: ['.js'] };
