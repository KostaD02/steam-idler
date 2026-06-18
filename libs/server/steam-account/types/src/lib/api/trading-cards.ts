export interface GameWithCards {
  appid: number;
  name: string;
  iconUrl: string;
  playtimeForever: number;
  cardsRemaining: number | null;
}

export interface OwnedGame {
  appid: number;
  name: string;
  playtimeForever: number;
}

export type GetCardsResponse = GameWithCards[];
