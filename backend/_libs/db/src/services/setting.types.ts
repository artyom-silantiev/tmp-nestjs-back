export const rootPrefix = () => "root:";
export const userPrefix = (userId: string) => `user:${userId}:`;

export enum SettingsNames {}

export type SettingBase = {
  baseName: SettingsNames;
  value: any;
};

export type SettingItem = SettingBase;
