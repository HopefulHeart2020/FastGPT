import { SYSTEM_PROMPT_HEADER, NEW_CHATID_HEADER } from '@/constants/chat';

interface StreamFetchProps {
  url: string;
  data: any;
  onMessage: (text: string) => void;
  abortSignal: AbortController;
}
export const streamFetch = ({ url, data, onMessage, abortSignal }: StreamFetchProps) =>
  new Promise<{ responseText: string; systemPrompt: string; newChatId: string }>(
    async (resolve, reject) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          signal: abortSignal.signal
        });
        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();

        const systemPrompt = decodeURIComponent(res.headers.get(SYSTEM_PROMPT_HEADER) || '').trim();
        const newChatId = decodeURIComponent(res.headers.get(NEW_CHATID_HEADER) || '');

        let responseText = '';

        const read = async () => {
          try {
            const { done, value } = await reader?.read();
            if (done) {
              if (res.status === 200) {
                resolve({ responseText, systemPrompt, newChatId });
              } else {
                const parseError = JSON.parse(responseText);
                reject(parseError?.message || '请求异常');
              }

              return;
            }
            const text = decoder.decode(value);
            responseText += text;
            onMessage(text);
            read();
          } catch (err: any) {
            if (err?.message === 'The user aborted a request.') {
              return resolve({ responseText, systemPrompt, newChatId });
            }
            reject(typeof err === 'string' ? err : err?.message || '请求异常');
          }
        };
        read();
      } catch (err: any) {
        console.log(err, '====');
        reject(typeof err === 'string' ? err : err?.message || '请求异常');
      }
    }
  );
