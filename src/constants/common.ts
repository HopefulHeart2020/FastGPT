export enum EmailTypeEnum {
  register = 'register',
  findPassword = 'findPassword'
}

export const PRICE_SCALE = 100000;

export const introPage = `
## 欢迎使用 Fast GPT

[Git 仓库](https://github.com/c121914yu/FastGPT)

### 交流群/问题反馈
wx号: YNyiqi
![](/imgs/wxerweima300.jpg)


### 快速开始
1. 使用邮箱注册账号。  
2. 进入账号页面，添加关联账号，目前只有 openai 的账号可以添加，直接去 openai 官网，把 API Key 粘贴过来。  
3. 如果填写了自己的 openai 账号，使用时会直接用你的账号。如果没有填写，需要付费使用平台的账号。
4. 进入模型页，创建一个模型，建议直接用 ChatGPT。    
5. 在模型列表点击【对话】，即可使用 API 进行聊天。  

### 定制 prompt

1. 进入模型编辑页  
2. 调整温度和提示词  
3. 使用该模型对话。每次对话时，提示词和温度都会自动注入，方便管理个人的模型。建议把自己日常经常需要使用的 5~10 个方向预设好。

### 知识库

1. 创建模型时选择【知识库】  
2. 进入模型编辑页  
3. 导入数据，可以选择手动导入，或者选择文件导入。文件导入会自动调用 chatGPT 理解文件内容，并生成知识库。  
4. 使用该模型对话。  

注意：使用知识库模型对话时，tokens 消耗会加快。  

### 价格表
如果使用了自己的 Api Key，不会计费。可以在账号页，看到详细账单。单纯使用 chatGPT 模型进行对话，只有一个计费项目。使用知识库时，包含**对话**和**索引**生成两个计费项。
| 计费项 | 价格: 元/ 1K tokens（包含上下文）|
| --- | --- | 
| chatgpt - 对话 | 0.03 |
| 知识库 - 对话 | 0.03 |
| 知识库 - 索引 | 0.004 |
| 文件拆分 | 0.03 |
`;

export const chatProblem = `
## 常见问题
**内容长度**
单次最长 4000 tokens, 上下文最长 8000 tokens, 上下文超长时会被截断。

**删除和复制**
点击对话头像，可以选择复制或删除该条内容。

**代理出错**
服务器代理不稳定，可以过一会儿再尝试。  
`;

export const versionIntro = `
## Fast GPT V2.5
* 内容压缩，替换中文标点符号和多余符号，减少一些上下文tokens。
* 优化 QA 拆分记账。
`;

export const shareHint = `
你正准备分享对话，请确保分享链接不会滥用，因为它是使用的是你的 API key。  
* 分享空白对话：为该模型创建一个空白的聊天分享出去。  
* 分享当前对话：会把当前聊天的内容也分享出去，但是要注意不要多个人同时用一个聊天内容。
`;
