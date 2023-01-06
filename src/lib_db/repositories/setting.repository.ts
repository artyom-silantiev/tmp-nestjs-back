import { Setting } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  rootPrefix,
  SettingItem,
  SettingsNames,
  userPrefix,
} from './setting.types';

/*
  Settings can have several levels: 

  Root - root level, these settings are default if no settings higher level. 
  User - These settings are user specific and overwrite the root settings.

  Example:

  root:some_setting=SETTING_VALUE_FOR_ROOT
  user:<ID>:some_setting=SETTING_VALUE_FOR_USER
  stream:<ID>:some_setting=SETTING_VALUE_FOR_STREAM

  root > user > stream
*/

@Injectable()
export class SettingRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.setting;
  }

  toView(setting: Setting) {
    return {
      name: setting.name,
      value: setting.value,
    };
  }

  private async get(name: string) {
    const setting = await this.prisma.setting.findFirst({
      where: {
        name,
      },
    });

    if (!setting) {
      return null;
    }

    return setting;
  }

  private async set(name: string, value: any) {
    const setting = await this.prisma.setting.findFirst({
      where: {
        name,
      },
    });

    if (!setting) {
      const newSetting = await this.prisma.setting.create({
        data: {
          name,
          value,
        },
      });
      return newSetting;
    }

    const updatedSetting = await this.prisma.setting.update({
      where: {
        id: setting.id,
      },
      data: {
        value,
      },
    });

    return updatedSetting;
  }

  private async del(name) {
    const setting = await this.prisma.setting.findFirst({
      where: {
        name,
      },
    });

    if (!setting) {
      return false;
    }

    await this.prisma.setting.delete({
      where: {
        id: setting.id,
      },
    });

    return true;
  }

  private async getAllSettingsByPrefix(prefix: string) {
    const settings = await this.prisma.setting.findMany({
      where: {
        name: {
          startsWith: prefix,
        },
      },
    });

    return settings;
  }

  async getAllRootSettings() {
    return await this.getAllSettingsByPrefix(rootPrefix());
  }

  async setRootSetting(settingItem: SettingItem) {
    const name = rootPrefix() + settingItem.baseName;
    return await this.set(name, settingItem.value);
  }

  async setRootSettings(settingItems: SettingItem[]) {
    for (const item of settingItems) {
      await this.setRootSetting(item);
    }
  }

  async getRootSetting(
    settingBaseName: SettingsNames,
  ): Promise<null | SettingItem> {
    const name = rootPrefix() + settingBaseName;

    const setting = await this.get(name);

    if (!setting) {
      return null;
    }

    const settingItem = {
      baseName: settingBaseName,
      value: setting.value,
    } as SettingItem;

    return settingItem;
  }

  async getAllUserSettings(userId: bigint) {
    return await this.getAllSettingsByPrefix(userPrefix(userId.toString()));
  }

  async setUserSetting(settingItem: SettingItem, userId: bigint) {
    const userSettingName =
      userPrefix(userId.toString()) + settingItem.baseName;
    return await this.set(userSettingName, settingItem.value);
  }

  async getUserSetting(
    settingBaseName: SettingsNames,
    userId: bigint,
  ): Promise<null | SettingItem> {
    const userStName = userPrefix(userId.toString()) + settingBaseName;

    const userSetting = await this.get(userStName);

    if (userSetting) {
      return null;
    }

    const userSettingItem = {
      baseName: settingBaseName,
      value: userSetting.value,
    } as SettingItem;

    return userSettingItem;
  }

  async getUserOrRootSetting(
    settingBaseName: SettingsNames,
    userId: bigint,
  ): Promise<null | SettingItem> {
    const userSetttingItem = await this.getUserSetting(settingBaseName, userId);

    if (userSetttingItem) {
      return userSetttingItem;
    }

    const rootSettingItem = await this.getRootSetting(settingBaseName);

    return rootSettingItem;
  }

  async deleteUserSetting(settingBaseName: SettingsNames, userId: bigint) {
    const userStName = userPrefix(userId.toString()) + settingBaseName;
    return this.del(userStName);
  }
}
