import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase, ShareChat } from '@/service/mongo';
import type { InitShareChatResponse } from '@/api/response/chat';
import { authModel } from '@/service/utils/auth';
import { hashPassword } from '@/service/utils/tools';

/* 初始化我的聊天框，需要身份验证 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let { shareId, password = '' } = req.query as {
      shareId: string;
      password: string;
    };

    if (!shareId) {
      throw new Error('params is error');
    }

    await connectToDatabase();

    // get shareChat
    const shareChat = await ShareChat.findById(shareId);

    if (!shareChat) {
      throw new Error('分享链接已失效');
    }

    if (shareChat.password !== hashPassword(password)) {
      return jsonRes(res, {
        code: 501,
        message: '密码不正确'
      });
    }

    // 校验使用权限
    const { model } = await authModel({
      modelId: shareChat.modelId,
      userId: String(shareChat.userId)
    });

    jsonRes<InitShareChatResponse>(res, {
      data: {
        maxContext: shareChat.maxContext,
        model: {
          name: model.name,
          avatar: model.avatar,
          intro: model.share.intro
        },
        chatModel: model.chat.chatModel
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
