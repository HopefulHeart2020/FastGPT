import React from 'react';
import { Box, Flex, Button, Tooltip } from '@chakra-ui/react';
import type { ShareModelItem } from '@/types/model';
import { useRouter } from 'next/router';
import MyIcon from '@/components/Icon';
import styles from '../index.module.scss';
import Avatar from '@/components/Avatar';

const ShareModelList = ({
  models = [],
  onclickCollection
}: {
  models: ShareModelItem[];
  onclickCollection: (modelId: string) => void;
}) => {
  const router = useRouter();

  return (
    <>
      {models.map((model) => (
        <Flex
          w={'100%'}
          flexDirection={'column'}
          key={model._id}
          p={4}
          border={'1px solid'}
          borderColor={'gray.200'}
          borderRadius={'md'}
        >
          <Flex alignItems={'center'}>
            <Avatar
              src={model.avatar}
              w={['28px', '36px']}
              h={['28px', '36px']}
              borderRadius={'50%'}
            />
            <Box fontWeight={'bold'} fontSize={'lg'} ml={5}>
              {model.name}
            </Box>
          </Flex>
          <Tooltip label={model.share.intro}>
            <Box
              className={styles.intro}
              flex={1}
              my={4}
              fontSize={'sm'}
              wordBreak={'break-all'}
              color={'blackAlpha.600'}
            >
              {model.share.intro || '这个 应用 还没有介绍~'}
            </Box>
          </Tooltip>

          <Flex justifyContent={'space-between'}>
            <Flex
              alignItems={'center'}
              cursor={'pointer'}
              color={model.isCollection ? 'myBlue.700' : 'blackAlpha.700'}
              onClick={() => onclickCollection(model._id)}
            >
              <MyIcon
                mr={1}
                name={model.isCollection ? 'collectionSolid' : 'collectionLight'}
                w={'16px'}
              />
              {model.share.collection}
            </Flex>
            <Box>
              <Button
                size={'sm'}
                variant={'outline'}
                w={['60px', '70px']}
                onClick={() => router.push(`/chat?modelId=${model._id}`)}
              >
                体验
              </Button>
            </Box>
          </Flex>
        </Flex>
      ))}
    </>
  );
};

export default ShareModelList;
