import React from 'react';
import { Card, Box, Image, Flex } from '@chakra-ui/react';
import { useMarkdown } from '@/hooks/useMarkdown';
import Markdown from '@/components/Markdown';
import { LOGO_ICON } from '@/constants/chat';

const Empty = ({
  model: { name, intro, avatar }
}: {
  model: {
    name: string;
    intro: string;
    avatar: string;
  };
}) => {
  const { data: chatProblem } = useMarkdown({ url: '/chatProblem.md' });
  const { data: versionIntro } = useMarkdown({ url: '/versionIntro.md' });

  return (
    <Box
      minH={'100%'}
      w={'85%'}
      maxW={'600px'}
      m={'auto'}
      py={'5vh'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {name && (
        <Card p={4} mb={10}>
          <Flex mb={2} alignItems={'center'} justifyContent={'center'}>
            <Image
              src={avatar || LOGO_ICON}
              w={'32px'}
              maxH={'40px'}
              objectFit={'contain'}
              alt={''}
            />
            <Box ml={3} fontSize={'3xl'} fontWeight={'bold'}>
              {name}
            </Box>
          </Flex>
          <Box whiteSpace={'pre-line'}>{intro}</Box>
        </Card>
      )}
      {/* version intro */}
      <Card p={4} mb={10}>
        <Markdown source={versionIntro} />
      </Card>
      <Card p={4}>
        <Markdown source={chatProblem} />
      </Card>
    </Box>
  );
};

export default Empty;
