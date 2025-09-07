import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import axios from 'axios';

@Injectable()
export class CommonUtility {
    constructor(private configService: AppConfigService) { }
    private readonly userAddressesKey = "user_addresses";


    async listLists() {
        try {
            const response = await axios.get(
                "https://api.quicknode.com/kv/rest/v1/lists",
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.quickNodeApiKey,
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error listing lists:', error);
        }
    }

    async getListByKey() {
        try {
            const response = await axios.get(
                `https://api.quicknode.com/kv/rest/v1/lists/${encodeURIComponent(this.userAddressesKey)}`,
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.quickNodeApiKey,
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting list by key:', error);
        }
    }

    async deleteListByKey() {
        try {
            const response = await axios.delete(
                `https://api.quicknode.com/kv/rest/v1/lists/${encodeURIComponent(this.userAddressesKey)}`,
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.quickNodeApiKey,
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting list by key:', error);
        }
    }

    async listContainsItem( item: string) {
        try {   
            const response = await axios.get(
                `https://api.quicknode.com/kv/rest/v1/lists/${encodeURIComponent(this.userAddressesKey)}/contains/${encodeURIComponent(item.toLowerCase())}`,
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.quickNodeApiKey,
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error checking list contains item:', error);
        }
    }

    async createUserAddressesList(initialAddresses: string[] = []) {
        try {
            const response = await axios.post(
                "https://api.quicknode.com/kv/rest/v1/lists",
                {
                    key: this.userAddressesKey,
                    items: initialAddresses.map(addr => addr.toLowerCase()),
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.quickNodeApiKey,
                    }
                }
            );
            return response.data
        } catch (error) {
            console.error('Error initializing list:', error);
        }
    }

    async addAddressesToList(addresses: string[] = []) {
        try {
            const response = await axios.patch(
                `https://api.quicknode.com/kv/rest/v1/lists/${encodeURIComponent(this.userAddressesKey)}`,
                {
                    addItems: addresses.map(addr => addr.toLowerCase()),
                    removeItems: []
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.quickNodeApiKey,
                    }
                }
            );
            return response.data
        } catch (error) {
            console.error('Error adding addresses:', error);
        }
    }

    async removeAddressesFromList(addresses: string[]) {
        try {
            const response = await axios.patch(
                `https://api.quicknode.com/kv/rest/v1/lists/${encodeURIComponent(this.userAddressesKey)}`,
                {
                    addItems: [],
                    removeItems: addresses.map(addr => addr.toLowerCase()),
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.quickNodeApiKey,
                    }
                }
            );
            return response.data
        } catch (error) {
            console.error('Error removing addresses:', error);
        }
    }


    async getTokenPrice(tokenAddress: string) {
        try {
            const alchemyUrl = this.configService.alchemyUrl;

            const response = await axios.post(
                alchemyUrl,
                { addresses: [{ network: "eth-mainnet", address: tokenAddress }] },
                { headers: { "Content-Type": "application/json" } }
            );
            const priceString = response.data.data[0]?.prices.find((p: any) => p.currency === "usd")?.value;
            if (!priceString) {
                throw new Error("Price data not available");
            }
            return parseFloat(priceString);
        } catch (error: any) {
            console.error("Error in getTokenPrice:", error.message ?? error);
            throw error;
        }
    }
}
