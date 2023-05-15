import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase, ShareChat } from '@/service/mongo';
import { authToken } from '@/service/utils/auth';

/* delete a shareChat by shareChatId */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query as {
      id: string;
    };

    await connectToDatabase();

    const userId = await authToken(req);

    await ShareChat.findOneAndRemove({
      _id: id,
      userId
    });

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
