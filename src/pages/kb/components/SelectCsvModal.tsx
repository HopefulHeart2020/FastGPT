import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody
} from '@chakra-ui/react';
import { useToast } from '@/hooks/useToast';
import { useSelectFile } from '@/hooks/useSelectFile';
import { useConfirm } from '@/hooks/useConfirm';
import { readCsvContent } from '@/utils/file';
import { useMutation } from '@tanstack/react-query';
import { postKbDataFromList } from '@/api/plugins/kb';
import Markdown from '@/components/Markdown';
import { useMarkdown } from '@/hooks/useMarkdown';
import { fileDownload } from '@/utils/file';
import { TrainingModeEnum } from '@/constants/plugin';
import { getErrText } from '@/utils/tools';

const csvTemplate = `question,answer\n"什么是 laf","laf 是一个云函数开发平台……"\n"什么是 sealos","Sealos 是以 kubernetes 为内核的云操作系统发行版,可以……"`;

const SelectJsonModal = ({
  onClose,
  onSuccess,
  kbId
}: {
  onClose: () => void;
  onSuccess: () => void;
  kbId: string;
}) => {
  const [selecting, setSelecting] = useState(false);
  const { toast } = useToast();
  const { File, onOpen } = useSelectFile({ fileType: '.csv', multiple: false });
  const [fileData, setFileData] = useState<{ q: string; a: string }[]>([]);
  const [successData, setSuccessData] = useState(0);
  const { openConfirm, ConfirmChild } = useConfirm({
    content: '确认导入该数据集?'
  });

  const onSelectFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      setSelecting(true);
      try {
        const { header, data } = await readCsvContent(file);
        if (header[0] !== 'question' || header[1] !== 'answer') {
          throw new Error('csv 文件格式有误');
        }
        setFileData(
          data.map((item) => ({
            q: item[0] || '',
            a: item[1] || ''
          }))
        );
      } catch (error: any) {
        toast({
          title: getErrText(error, 'csv 文件格式有误'),
          status: 'error'
        });
      }
      setSelecting(false);
    },
    [setSelecting, toast]
  );

  const { mutate, isLoading: uploading } = useMutation({
    mutationFn: async () => {
      if (!fileData || fileData.length === 0) return;

      let success = 0;

      // subsection import
      const step = 50;
      for (let i = 0; i < fileData.length; i += step) {
        const { insertLen } = await postKbDataFromList({
          kbId,
          data: fileData.slice(i, i + step),
          mode: TrainingModeEnum.index
        });
        success += insertLen || 0;
        setSuccessData((state) => state + step);
      }

      toast({
        title: `导入数据成功，最终导入: ${success} 条数据。需要一段时间训练`,
        status: 'success',
        duration: 4000
      });
      onClose();
      onSuccess();
    },
    onError(err) {
      toast({
        title: getErrText(err, '导入文件失败'),
        status: 'error'
      });
    }
  });

  const { data: intro } = useMarkdown({ url: '/csvSelect.md' });

  return (
    <Modal isOpen={true} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent maxW={'90vw'} position={'relative'} m={0} h={'90vh'}>
        <ModalHeader>csv 问答对导入</ModalHeader>
        <ModalCloseButton />

        <ModalBody h={'100%'} display={['block', 'flex']} fontSize={'sm'} overflowY={'auto'}>
          <Box flex={'2 0 0'} w={['100%', 0]} mr={[0, 4]} mb={[4, 0]}>
            <Markdown source={intro} />
            <Box
              my={3}
              cursor={'pointer'}
              textDecoration={'underline'}
              color={'myBlue.600'}
              onClick={() =>
                fileDownload({
                  text: csvTemplate,
                  type: 'text/csv',
                  filename: 'template.csv'
                })
              }
            >
              点击下载csv模板
            </Box>
            <Flex alignItems={'center'}>
              <Button isLoading={selecting} isDisabled={uploading} onClick={onOpen}>
                选择 csv 问答对
              </Button>

              <Box ml={4}>一共 {fileData.length} 组数据（下面最多展示100组）</Box>
            </Flex>
          </Box>
          <Box flex={'3 0 0'} h={'100%'} overflow={'auto'} p={2} backgroundColor={'blackAlpha.50'}>
            {fileData.slice(0, 100).map((item, index) => (
              <Box key={index}>
                <Box>
                  Q{index + 1}. {item.q}
                </Box>
                <Box>
                  A{index + 1}. {item.a}
                </Box>
              </Box>
            ))}
          </Box>
        </ModalBody>

        <Flex px={6} pt={2} pb={4}>
          <Box flex={1}></Box>
          <Button variant={'outline'} isLoading={uploading} mr={3} onClick={onClose}>
            取消
          </Button>
          <Button isDisabled={fileData.length === 0 || uploading} onClick={openConfirm(mutate)}>
            {uploading ? (
              <Box>{Math.round((successData / fileData.length) * 100)}%</Box>
            ) : (
              '确认导入'
            )}
          </Button>
        </Flex>
      </ModalContent>
      <ConfirmChild />
      <File onSelect={onSelectFile} />
    </Modal>
  );
};

export default SelectJsonModal;
