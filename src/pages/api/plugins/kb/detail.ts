import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase, KB } from '@/service/mongo';
import { authToken } from '@/service/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { id } = req.query as {
      id: string;
    };

    if (!id) {
      throw new Error('缺少参数');
    }

    // 凭证校验
    const userId = await authToken(req);

    await connectToDatabase();

    const data = await KB.findOne({
      _id: id,
      userId
    });

    if (!data) {
      throw new Error('kb is not exist');
    }

    jsonRes(res, {
      data: {
        _id: data._id,
        avatar: data.avatar,
        name: data.name,
        userId: data.userId,
        updateTime: data.updateTime,
        tags: data.tags.join(' ')
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
