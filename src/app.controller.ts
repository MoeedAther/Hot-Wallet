import { Controller, Get} from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Hello World!";
  }

  // @Get('kv/lists')
  // async lists() {
  //   try {
  //     return await this.commonUtility.listLists();
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  // @Get('kv/list')
  // async getListByKey() {
  //   try {
  //     return await this.commonUtility.getListByKey();
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  // @Get('kv/delete')
  // async deleteListByKey() {
  //   try {
  //     return await this.commonUtility.deleteListByKey();
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  // @Get('kv/contains')
  // async listContainsItem(@Query('item') item: string) {
  //   try {
  //     if (!item) {
  //       throw new BadRequestException('Query parameter "item" is required');
  //     }
  //     return await this.commonUtility.listContainsItem(item);
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  // @Post('kv/create')
  // async createUserAddresses(@Body('addresses') addresses?: string[]) {
  //   try {
  //     const kvAddresses = Array.isArray(addresses) ? addresses : [];
  //     return await this.commonUtility.createUserAddressesList(kvAddresses);
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  // @Patch('kv/add')
  // async addUserAddresses(@Body('addresses') addresses: string[]) {
  //   try {
  //     if (!Array.isArray(addresses) || addresses.length === 0) {
  //       throw new BadRequestException('Body field "addresses" must be a non-empty array');
  //     }
  //     const kvAddresses = addresses;
  //     return await this.commonUtility.addAddressesToList(kvAddresses);
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  // @Patch('kv/remove')
  // async removeUserAddresses(@Body('addresses') addresses: string[]) {
  //   try {
  //     if (!Array.isArray(addresses) || addresses.length === 0) {
  //       throw new BadRequestException('Body field "addresses" must be a non-empty array');
  //     }
  //     const kvAddresses = addresses;
  //     return await this.commonUtility.removeAddressesFromList(kvAddresses);
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }
}
