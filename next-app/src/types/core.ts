export type EntityId = string;

export type Timestamped = {
  createdAt: string;
  updatedAt: string;
};

export type UserOwned = {
  userId: EntityId;
};
