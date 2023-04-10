// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase, OpenApi } from '@/service/mongo';
import { authToken } from '@/service/utils/tools';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query as { id: string };
    const { authorization } = req.headers;

    if (!authorization) {
      throw new Error('缺少登录凭证');
    }

    if (!id) {
      throw new Error('缺少参数');
    }

    const userId = await authToken(authorization);

    await connectToDatabase();

    await OpenApi.findOneAndRemove({ _id: id, userId });

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
