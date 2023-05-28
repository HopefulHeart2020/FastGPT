import type { NextApiRequest, NextApiResponse } from 'next';
import type { KbDataItemType } from '@/types/plugin';
import { jsonRes } from '@/service/response';
import { connectToDatabase, TrainingData } from '@/service/mongo';
import { authUser } from '@/service/utils/auth';
import { authKb } from '@/service/utils/auth';
import { withNextCors } from '@/service/utils/tools';
import { TrainingModeEnum } from '@/constants/plugin';
import { startQueue } from '@/service/utils/tools';
import { PgClient } from '@/service/pg';

export type Props = {
  kbId: string;
  data: { a: KbDataItemType['a']; q: KbDataItemType['q'] }[];
  mode: `${TrainingModeEnum}`;
  prompt?: string;
};

export type Response = {
  insertLen: number;
};

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { kbId, data, mode, prompt } = req.body as Props;

    if (!kbId || !Array.isArray(data)) {
      throw new Error('缺少参数');
    }
    await connectToDatabase();

    // 凭证校验
    const { userId } = await authUser({ req });

    jsonRes<Response>(res, {
      data: await pushDataToKb({
        kbId,
        data,
        userId,
        mode,
        prompt
      })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});

export async function pushDataToKb({
  userId,
  kbId,
  data,
  mode,
  prompt
}: { userId: string } & Props): Promise<Response> {
  await authKb({
    userId,
    kbId
  });

  // 过滤重复的 qa 内容
  const set = new Set();
  const filterData: {
    a: string;
    q: string;
  }[] = [];

  data.forEach((item) => {
    const text = item.q + item.a;
    if (!set.has(text)) {
      filterData.push(item);
      set.add(text);
    }
  });

  // 数据库去重
  const insertData = (
    await Promise.allSettled(
      filterData.map(async ({ q, a = '' }) => {
        if (mode !== TrainingModeEnum.index) {
          return Promise.resolve({
            q,
            a
          });
        }

        if (!q) {
          return Promise.reject('q为空');
        }

        q = q.replace(/\\n/g, '\n').trim().replace(/'/g, '"');
        a = a.replace(/\\n/g, '\n').trim().replace(/'/g, '"');

        // Exactly the same data, not push
        try {
          const { rows } = await PgClient.query(`
            SELECT COUNT(*) > 0 AS exists
            FROM  modelData 
            WHERE md5(q)=md5('${q}') AND md5(a)=md5('${a}') AND user_id='${userId}' AND kb_id='${kbId}'
          `);
          const exists = rows[0]?.exists || false;

          if (exists) {
            return Promise.reject('已经存在');
          }
        } catch (error) {
          console.log(error);
          error;
        }
        return Promise.resolve({
          q,
          a
        });
      })
    )
  )
    .filter((item) => item.status === 'fulfilled')
    .map<{ q: string; a: string }>((item: any) => item.value);

  // 插入记录
  await TrainingData.insertMany(
    insertData.map((item) => ({
      q: item.q,
      a: item.a,
      userId,
      kbId,
      mode,
      prompt
    }))
  );

  insertData.length > 0 && startQueue();

  return {
    insertLen: insertData.length
  };
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
};
