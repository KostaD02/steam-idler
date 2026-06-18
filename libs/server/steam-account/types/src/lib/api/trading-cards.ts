export interface GameWithCards {
  appid: number;
  name: string;
  iconUrl: string;
  playtimeForever: number;
  cardsRemaining: number;
}

export type GetCardsResponse = GameWithCards[];
