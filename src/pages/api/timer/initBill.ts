// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase, Bill } from '@/service/mongo';
import { authToken } from '@/service/utils/tools';
import type { BillSchema } from '@/types/mongoSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.headers.auth !== 'archer') {
      throw new Error('凭证错误');
    }
    await connectToDatabase();

    await Bill.updateMany(
      {},
      {
        type: 'chat',
        modelName: 'gpt-3.5-turbo'
      }
    );

    jsonRes(res, {
      data: {}
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
