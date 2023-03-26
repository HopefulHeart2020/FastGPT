import { Schema, model, models, Model } from 'mongoose';
import { modelList } from '@/constants/model';
import { BillSchema as BillType } from '@/types/mongoSchema';
import { BillTypeMap } from '@/constants/user';

const BillSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  type: {
    type: String,
    enum: Object.keys(BillTypeMap),
    required: true
  },
  modelName: {
    type: String,
    enum: modelList.map((item) => item.model),
    required: true
  },
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'chat'
  },
  time: {
    type: Date,
    default: () => new Date()
  },
  textLen: {
    // 提示词+响应的总字数
    type: Number,
    required: true
  },
  tokenLen: {
    // 折算成 token 的数量
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

export const Bill: Model<BillType> = models['bill'] || model('bill', BillSchema);
