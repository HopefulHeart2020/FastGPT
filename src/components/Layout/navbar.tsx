import React, { useMemo } from 'react';
import { Box, Flex, Tooltip, Link } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import MyIcon from '../Icon';
import { useUserStore } from '@/store/user';
import { useChatStore } from '@/store/chat';
import Avatar from '../Avatar';
import { HUMAN_ICON } from '@/constants/chat';
import NextLink from 'next/link';
import Badge from '../Badge';

export enum NavbarTypeEnum {
  normal = 'normal',
  small = 'small'
}

const Navbar = ({ unread }: { unread: number }) => {
  const router = useRouter();
  const { userInfo, lastModelId } = useUserStore();
  const { lastChatModelId, lastChatId } = useChatStore();
  const navbarList = useMemo(
    () => [
      {
        label: '聊天',
        icon: 'chat',
        link: `/chat?modelId=${lastChatModelId}&chatId=${lastChatId}`,
        activeLink: ['/chat']
      },
      {
        label: '我的应用',
        icon: 'model',
        link: `/model?modelId=${lastModelId}`,
        activeLink: ['/model']
      },
      {
        label: '知识库',
        icon: 'kb',
        link: `/kb`,
        activeLink: ['/kb']
      },
      {
        label: '应用市场',
        icon: 'appStore',
        link: '/model/share',
        activeLink: ['/model/share']
      },
      {
        label: '开发',
        icon: 'develop',
        link: '/openapi',
        activeLink: ['/openapi']
      },
      {
        label: '账号',
        icon: 'user',
        link: '/number',
        activeLink: ['/number']
      }
    ],
    [lastChatId, lastChatModelId, lastModelId]
  );

  const itemStyles: any = {
    mb: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    w: '60px',
    h: '45px',
    _hover: {
      color: '#ffffff'
    }
  };

  return (
    <Flex
      flexDirection={'column'}
      alignItems={'center'}
      pt={6}
      backgroundColor={'#465069'}
      h={'100%'}
      w={'100%'}
      boxShadow={'4px 0px 4px 0px rgba(43, 45, 55, 0.01)'}
      userSelect={'none'}
    >
      {/* logo */}
      <Box
        mb={5}
        border={'2px solid #fff'}
        borderRadius={'36px'}
        overflow={'hidden'}
        cursor={'pointer'}
        onClick={() => router.push('/number')}
      >
        <Avatar w={'36px'} h={'36px'} src={userInfo?.avatar} fallbackSrc={HUMAN_ICON} />
      </Box>
      {/* 导航列表 */}
      <Box flex={1}>
        {navbarList.map((item) => (
          <Tooltip
            label={item.label}
            key={item.label}
            placement={'right'}
            openDelay={100}
            gutter={-10}
          >
            <Link
              as={NextLink}
              href={item.link}
              {...itemStyles}
              {...(item.activeLink.includes(router.pathname)
                ? {
                    color: '#ffffff ',
                    backgroundImage: 'linear-gradient(270deg,#4e83fd,#3370ff)'
                  }
                : {
                    color: '#9096a5',
                    backgroundColor: 'transparent'
                  })}
            >
              <MyIcon name={item.icon as any} width={'22px'} height={'22px'} />
            </Link>
          </Tooltip>
        ))}
      </Box>
      {unread > 0 && (
        <Box>
          <Link as={NextLink} {...itemStyles} href={`/number?type=inform`} mb={0} color={'#9096a5'}>
            <Badge count={unread}>
              <MyIcon name={'inform'} width={'22px'} height={'22px'} />
            </Badge>
          </Link>
        </Box>
      )}
      <Box>
        <Link
          as={NextLink}
          href="https://github.com/c121914yu/FastGPT"
          target={'_blank'}
          {...itemStyles}
          color={'#9096a5'}
        >
          <MyIcon name={'git'} width={'22px'} height={'22px'} />
        </Link>
      </Box>
    </Flex>
  );
};

export default Navbar;
