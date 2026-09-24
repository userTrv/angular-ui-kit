import apiJson from '../generated/api.json';

export interface ApiInput {
  name: string;
  type: string;
  default?: string;
  required: boolean;
  twoWay: boolean;
  description: string;
}
export interface ApiOutput {
  name: string;
  type: string;
  description: string;
}
export interface ApiMember {
  name: string;
  signature?: string;
  type?: string;
  description: string;
}
export interface ApiItem {
  name: string;
  kind: string;
  selector?: string;
  exportAs?: string;
  description: string;
  signature?: string;
  inputs?: ApiInput[];
  outputs?: ApiOutput[];
  methods?: ApiMember[];
  properties?: ApiMember[];
}

export const API = apiJson as unknown as Record<string, ApiItem[]>;

export function findApi(entryPoint: string, name: string): ApiItem | undefined {
  return API[entryPoint]?.find((item) => item.name === name);
}
