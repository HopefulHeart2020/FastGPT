import { Configuration, OpenAIApi } from 'openai';
import { Chat } from '../mongo';
import type { ChatPopulate } from '@/types/mongoSchema';
import { formatPrice } from '@/utils/user';
import { authToken } from './tools';

export const getOpenAIApi = (apiKey: string) => {
  const configuration = new Configuration({
    apiKey
  });

  return new OpenAIApi(configuration, undefined);
};

export const authChat = async (chatId: string, authorization?: string) => {
  // 获取 chat 数据
  const chat = await Chat.findById<ChatPopulate>(chatId)
    .populate({
      path: 'modelId',
      options: {
        strictPopulate: false
      }
    })
    .populate({
      path: 'userId',
      options: {
        strictPopulate: false
      }
    });

  if (!chat || !chat.modelId || !chat.userId) {
    return Promise.reject('模型不存在');
  }

  // 安全校验
  if (chat.loadAmount === 0 || chat.expiredTime <= Date.now()) {
    return Promise.reject('聊天框已过期');
  }

  // 分享校验
  if (!chat.isShare) {
    await authToken(authorization);
  }

  // 获取 user 的 apiKey
  const user = chat.userId;

  const userApiKey = user.accounts?.find((item: any) => item.type === 'openai')?.value;

  if (!userApiKey && formatPrice(user.balance) <= 0) {
    return Promise.reject('该账号余额不足');
  }

  return {
    userApiKey,
    systemKey: process.env.OPENAIKEY as string,
    chat,
    userId: user._id
  };
};
