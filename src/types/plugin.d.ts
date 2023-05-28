import type { kbSchema } from './mongoSchema';

/* kb type */
export interface KbItemType extends kbSchema {
  totalData: number;
  tags: string;
}

export interface KbDataItemType {
  id: string;
  q: string; // 提问词
  a: string; // 原文
  kbId: string;
  userId: string;
}

export type TextPluginRequestParams = {
  input: string;
};
