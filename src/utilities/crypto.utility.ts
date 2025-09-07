import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from 'src/config/config.service';

@Injectable()
export class CryptoUtility {

    constructor(private configService: AppConfigService) {    }

    encrypt(text: string): string {
        const iv = randomBytes(16);
        const key = scryptSync(this.configService.encryptionKey, 'salt', 32);
        const cipher = createCipheriv('aes-256-ctr', key, iv);
        const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const ivHex = iv.toString('hex');
        const encryptedHex = encryptedBuffer.toString('hex');
        return `${ivHex}:${encryptedHex}`;
    }

    decrypt(encryptedText: string): string {
        const [ivHex, encryptedHex] = encryptedText.split(':');
        if (!ivHex || !encryptedHex) {
           throw new Error('Invalid encrypted text format');
        }
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
        const key = scryptSync(this.configService.encryptionKey, 'salt', 32);
        const decipher = createDecipheriv('aes-256-ctr', key, iv);
        const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
        return decryptedBuffer.toString('utf8');
    }
}