import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  getInitChatSiteInfo,
  getChatSiteId,
  postGPT3SendPrompt,
  delChatRecordByIndex,
  postSaveChat
} from '@/api/chat';
import type { InitChatResponse } from '@/api/response/chat';
import { ChatSiteItemType } from '@/types/chat';
import {
  Textarea,
  Box,
  Flex,
  Button,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { useToast } from '@/hooks/useToast';
import { useScreen } from '@/hooks/useScreen';
import { useQuery } from '@tanstack/react-query';
import { ChatModelNameEnum } from '@/constants/model';
import dynamic from 'next/dynamic';
import { useGlobalStore } from '@/store/global';
import { useChatStore } from '@/store/chat';
import { useCopyData } from '@/utils/tools';
import { streamFetch } from '@/api/fetch';
import SlideBar from './components/SlideBar';
import Empty from './components/Empty';
import { getToken } from '@/utils/user';
import Icon from '@/components/Icon';

const Markdown = dynamic(() => import('@/components/Markdown'));

const textareaMinH = '22px';

interface ChatType extends InitChatResponse {
  history: ChatSiteItemType[];
}

const Chat = ({ chatId }: { chatId: string }) => {
  const { toast } = useToast();
  const router = useRouter();
  const ChatBox = useRef<HTMLDivElement>(null);
  const TextareaDom = useRef<HTMLTextAreaElement>(null);
  // 中断请求
  const controller = useRef(new AbortController());
  const [chatData, setChatData] = useState<ChatType>({
    chatId: '',
    modelId: '',
    name: '',
    avatar: '',
    intro: '',
    secret: {},
    chatModel: '',
    modelName: '',
    history: [],
    isExpiredTime: false
  }); // 聊天框整体数据
  const [inputVal, setInputVal] = useState(''); // 输入的内容

  const isChatting = useMemo(
    () => chatData.history[chatData.history.length - 1]?.status === 'loading',
    [chatData.history]
  );
  const chatWindowError = useMemo(() => {
    if (chatData.isExpiredTime) {
      return {
        text: '聊天框已过期'
      };
    }

    return '';
  }, [chatData]);
  const { copyData } = useCopyData();
  const { isPc, media } = useScreen();
  const { setLoading } = useGlobalStore();

  const { isOpen: isOpenSlider, onClose: onCloseSlider, onOpen: onOpenSlider } = useDisclosure();
  const { pushChatHistory } = useChatStore();

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      ChatBox.current &&
        ChatBox.current.scrollTo({
          top: ChatBox.current.scrollHeight,
          behavior: 'smooth'
        });
    }, 100);
  }, []);

  // 重置输入内容
  const resetInputVal = useCallback((val: string) => {
    setInputVal(val);
    setTimeout(() => {
      /* 回到最小高度 */
      if (TextareaDom.current) {
        TextareaDom.current.style.height =
          val === '' ? textareaMinH : `${TextareaDom.current.scrollHeight}px`;
      }
    }, 100);
  }, []);

  // 重载对话
  const resetChat = useCallback(async () => {
    if (!chatData) return;
    try {
      router.replace(`/chat?chatId=${await getChatSiteId(chatData.modelId)}`);
    } catch (error: any) {
      toast({
        title: error?.message || '生成新对话失败',
        status: 'warning'
      });
    }
    onCloseSlider();
  }, [chatData, onCloseSlider, router, toast]);

  // gpt3 方法
  const gpt3ChatPrompt = useCallback(
    async (newChatList: ChatSiteItemType[]) => {
      // 请求内容
      const response = await postGPT3SendPrompt({
        prompt: newChatList,
        chatId: chatId as string
      });

      // 更新 AI 的内容
      setChatData((state) => ({
        ...state,
        history: state.history.map((item, index) => {
          if (index !== state.history.length - 1) return item;
          return {
            ...item,
            status: 'finish',
            value: response
          };
        })
      }));
    },
    [chatId]
  );

  // gpt 对话
  const gptChatPrompt = useCallback(
    async (prompts: ChatSiteItemType) => {
      const urlMap: Record<string, string> = {
        [ChatModelNameEnum.GPT35]: '/api/chat/chatGpt',
        [ChatModelNameEnum.GPT3]: '/api/chat/gpt3'
      };

      if (!urlMap[chatData.modelName]) return Promise.reject('找不到模型');

      const prompt = {
        obj: prompts.obj,
        value: prompts.value
      };
      // 流请求，获取数据
      const res = await streamFetch({
        url: urlMap[chatData.modelName],
        data: {
          prompt,
          chatId
        },
        onMessage: (text: string) => {
          setChatData((state) => ({
            ...state,
            history: state.history.map((item, index) => {
              if (index !== state.history.length - 1) return item;
              return {
                ...item,
                value: item.value + text
              };
            })
          }));
        },
        abortSignal: controller.current
      });

      // 保存对话信息
      try {
        await postSaveChat({
          chatId,
          prompts: [
            prompt,
            {
              obj: 'AI',
              value: res as string
            }
          ]
        });
      } catch (err) {
        toast({
          title: '对话出现异常, 继续对话会导致上下文丢失，请刷新页面',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
      }

      // 设置完成状态
      setChatData((state) => ({
        ...state,
        history: state.history.map((item, index) => {
          if (index !== state.history.length - 1) return item;
          return {
            ...item,
            status: 'finish'
          };
        })
      }));
    },
    [chatData.modelName, chatId, toast]
  );

  /**
   * 发送一个内容
   */
  const sendPrompt = useCallback(async () => {
    const storeInput = inputVal;
    // 去除空行
    const val = inputVal
      .trim()
      .split('\n')
      .filter((val) => val)
      .join('\n');
    if (!chatData?.modelId || !val || !ChatBox.current || isChatting) {
      return;
    }

    const newChatList: ChatSiteItemType[] = [
      ...chatData.history,
      {
        obj: 'Human',
        value: val,
        status: 'finish'
      },
      {
        obj: 'AI',
        value: '',
        status: 'loading'
      }
    ];

    // 插入内容
    setChatData((state) => ({
      ...state,
      history: newChatList
    }));

    // 清空输入内容
    resetInputVal('');
    scrollToBottom();

    try {
      await gptChatPrompt(newChatList[newChatList.length - 2]);

      // 如果是 Human 第一次发送，插入历史记录
      const humanChat = newChatList.filter((item) => item.obj === 'Human');
      if (humanChat.length === 1) {
        pushChatHistory({
          chatId,
          title: humanChat[0].value
        });
      }
    } catch (err: any) {
      toast({
        title: typeof err === 'string' ? err : err?.message || '聊天出错了~',
        status: 'warning',
        duration: 5000,
        isClosable: true
      });

      resetInputVal(storeInput);

      setChatData((state) => ({
        ...state,
        history: newChatList.slice(0, newChatList.length - 2)
      }));
    }
  }, [
    inputVal,
    chatData?.modelId,
    chatData.history,
    isChatting,
    resetInputVal,
    scrollToBottom,
    gptChatPrompt,
    pushChatHistory,
    chatId,
    toast
  ]);

  // 删除一句话
  const delChatRecord = useCallback(
    async (index: number) => {
      setLoading(true);
      try {
        // 删除数据库最后一句
        await delChatRecordByIndex(chatId, index);

        setChatData((state) => ({
          ...state,
          history: state.history.filter((_, i) => i !== index)
        }));
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    },
    [chatId, setLoading]
  );

  // 复制内容
  const onclickCopy = useCallback(
    (chatId: string) => {
      const dom = document.getElementById(chatId);
      const innerText = dom?.innerText;
      innerText && copyData(innerText);
    },
    [copyData]
  );

  useEffect(() => {
    controller.current = new AbortController();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      controller.current?.abort();
    };
  }, [chatId]);

  // 初始化聊天框
  useQuery(
    ['init', chatId],
    () => {
      setLoading(true);
      return getInitChatSiteInfo(chatId);
    },
    {
      onSuccess(res) {
        setChatData({
          ...res,
          history: res.history.map((item) => ({
            ...item,
            status: 'finish'
          }))
        });
        if (res.history.length > 0) {
          setTimeout(() => {
            scrollToBottom();
          }, 500);
        }
      },
      onError(e: any) {
        toast({
          title: e?.message || '初始化异常,请检查地址',
          status: 'error',
          isClosable: true,
          duration: 5000
        });
      },
      onSettled() {
        setLoading(false);
      }
    }
  );

  return (
    <Flex
      h={'100%'}
      flexDirection={media('row', 'column')}
      backgroundColor={useColorModeValue('white', '')}
    >
      {isPc ? (
        <Box flex={'0 0 250px'} w={0} h={'100%'}>
          <SlideBar
            resetChat={resetChat}
            name={chatData?.name}
            chatId={chatId}
            modelId={chatData.modelId}
            onClose={onCloseSlider}
          />
        </Box>
      ) : (
        <Box h={'60px'} borderBottom={'1px solid rgba(0,0,0,0.1)'}>
          <Flex
            alignItems={'center'}
            h={'100%'}
            justifyContent={'space-between'}
            backgroundColor={useColorModeValue('white', 'gray.700')}
            color={useColorModeValue('blackAlpha.700', 'white')}
            position={'relative'}
            px={7}
          >
            <Box onClick={onOpenSlider}>
              <Icon
                name={'menu'}
                w={'20px'}
                h={'20px'}
                fill={useColorModeValue('blackAlpha.700', 'white')}
              />
            </Box>
            <Box>{chatData?.name}</Box>
          </Flex>
          <Drawer isOpen={isOpenSlider} placement="left" size={'xs'} onClose={onCloseSlider}>
            <DrawerOverlay backgroundColor={'rgba(255,255,255,0.5)'} />
            <DrawerContent maxWidth={'250px'}>
              <SlideBar
                resetChat={resetChat}
                name={chatData?.name}
                chatId={chatId}
                modelId={chatData.modelId}
                onClose={onCloseSlider}
              />
            </DrawerContent>
          </Drawer>
        </Box>
      )}

      <Flex
        {...media({ h: '100%', w: 0 }, { h: 0, w: '100%' })}
        flex={'1 0 0'}
        flexDirection={'column'}
      >
        {/* 聊天内容 */}
        <Box ref={ChatBox} flex={'1 0 0'} h={0} w={'100%'} overflowY={'auto'}>
          {chatData.history.map((item, index) => (
            <Box
              key={index}
              py={media(9, 6)}
              px={media(4, 2)}
              backgroundColor={
                index % 2 !== 0 ? useColorModeValue('blackAlpha.50', 'gray.700') : ''
              }
              color={useColorModeValue('blackAlpha.700', 'white')}
              borderBottom={'1px solid rgba(0,0,0,0.1)'}
            >
              <Flex maxW={'750px'} m={'auto'} alignItems={'flex-start'}>
                <Menu>
                  <MenuButton as={Box} mr={media(4, 1)} cursor={'pointer'}>
                    <Image
                      src={item.obj === 'Human' ? '/icon/human.png' : '/icon/logo.png'}
                      alt="/icon/logo.png"
                      width={media(30, 20)}
                      height={media(30, 20)}
                    />
                  </MenuButton>
                  <MenuList fontSize={'sm'}>
                    <MenuItem onClick={() => onclickCopy(`chat${index}`)}>复制</MenuItem>
                    <MenuItem onClick={() => delChatRecord(index)}>删除该行</MenuItem>
                  </MenuList>
                </Menu>
                <Box flex={'1 0 0'} w={0} overflow={'hidden'} id={`chat${index}`}>
                  {item.obj === 'AI' ? (
                    <Markdown
                      source={item.value}
                      isChatting={isChatting && index === chatData.history.length - 1}
                    />
                  ) : (
                    <Box whiteSpace={'pre-wrap'}>{item.value}</Box>
                  )}
                </Box>
              </Flex>
            </Box>
          ))}
          {chatData.history.length === 0 && <Empty intro={chatData.intro} />}
        </Box>
        {/* 发送区 */}
        <Box m={media('20px auto', '0 auto')} w={'100%'} maxW={media('min(750px, 100%)', 'auto')}>
          {!!chatWindowError ? (
            <Box textAlign={'center'}>
              <Box color={'red'}>{chatWindowError.text}</Box>
              <Flex py={5} justifyContent={'center'}>
                {getToken() && <Button onClick={resetChat}>重开对话</Button>}
              </Flex>
            </Box>
          ) : (
            <Box
              py={5}
              position={'relative'}
              boxShadow={`0 0 15px rgba(0,0,0,0.1)`}
              border={media('1px solid', '0')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderRadius={['none', 'md']}
              backgroundColor={useColorModeValue('white', 'gray.700')}
            >
              {/* 输入框 */}
              <Textarea
                ref={TextareaDom}
                w={'100%'}
                pr={'45px'}
                py={0}
                border={'none'}
                _focusVisible={{
                  border: 'none'
                }}
                placeholder="提问"
                resize={'none'}
                value={inputVal}
                rows={1}
                height={'22px'}
                lineHeight={'22px'}
                maxHeight={'150px'}
                maxLength={chatData?.secret.contentMaxLen || -1}
                overflowY={'auto'}
                color={useColorModeValue('blackAlpha.700', 'white')}
                onChange={(e) => {
                  const textarea = e.target;
                  setInputVal(textarea.value);
                  textarea.style.height = textareaMinH;
                  textarea.style.height = `${textarea.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  // 触发快捷发送
                  if (isPc && e.keyCode === 13 && !e.shiftKey) {
                    sendPrompt();
                    e.preventDefault();
                  }
                  // 全选内容
                  // @ts-ignore
                  e.key === 'a' && e.ctrlKey && e.target?.select();
                }}
              />
              {/* 发送和等待按键 */}
              <Box position={'absolute'} bottom={5} right={media('20px', '10px')}>
                {isChatting ? (
                  <Image
                    style={{ transform: 'translateY(4px)' }}
                    src={'/icon/chatting.svg'}
                    width={30}
                    height={30}
                    alt={''}
                  />
                ) : (
                  <Box cursor={'pointer'} onClick={sendPrompt}>
                    <Icon
                      name={'chatSend'}
                      width={'20px'}
                      height={'20px'}
                      fill={useColorModeValue('#718096', 'white')}
                    ></Icon>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Chat;

export async function getServerSideProps(context: any) {
  const chatId = context.query?.chatId || '';

  return {
    props: { chatId }
  };
}
