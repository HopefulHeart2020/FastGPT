// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase, OpenApi } from '@/service/mongo';
import { authToken } from '@/service/utils/auth';
import { UserOpenApiKey } from '@/types/openapi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await authToken(req);

    await connectToDatabase();

    const findResponse = await OpenApi.find({ userId }).sort({ _id: -1 });

    // jus save four data
    const apiKeys = findResponse.map<UserOpenApiKey>(
      ({ _id, apiKey, createTime, lastUsedTime }) => {
        return {
          id: _id,
          apiKey: `${apiKey.substring(0, 2)}******${apiKey.substring(apiKey.length - 2)}`,
          createTime,
          lastUsedTime
        };
      }
    );

    jsonRes(res, {
      data: apiKeys
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
