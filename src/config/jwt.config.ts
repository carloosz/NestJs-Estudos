import { registerAs } from '@nestjs/config';
import { JwtConfigInterface } from '../common/interfaces/jwt-config.interface';
import { StringValue } from 'ms';

export const jwtConfig = registerAs(
    'JWT_MODULE_CONFIG',
    (): JwtConfigInterface => ({
        access: {
            secret: process.env.JWT_ACCESS_SECRET || 'access',
            signOptions: {
                expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '1h') as StringValue,
            },
        },
        refresh: {
            secret: process.env.JWT_REFRESH_SECRET || 'refresh',
            signOptions: {
                expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue,
            }
        }
    })
);
