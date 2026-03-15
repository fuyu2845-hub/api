import { nanoid } from 'nanoid';

export function generateApiKey() {
  return `sk-cg-${nanoid(48)}`;
}

export function generateCdkCode() {
  return `CDK-${nanoid(24)}`;
}
