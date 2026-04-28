export interface SteamIdlerValidator<T = unknown> {
  name: string;
  validator: (value: T) => boolean;
}
