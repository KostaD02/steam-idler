import { Types } from 'mongoose';

export type MongoId = string | Types.ObjectId;

export interface MongoObject {
  _id: MongoId;
  createdAt: string;
  updatedAt: string;
}

export type MongoFields = keyof MongoObject;

export type StrippedMongoObject<T extends MongoObject> = Omit<T, MongoFields>;
