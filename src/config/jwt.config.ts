import { registerAs } from '@nestjs/config';
import { JwtConfigInterface } from '../common/interfaces/jwt-config.interface';
import { StringValue } from 'ms';

export const jwtConfig = registerAs(
    'JWT_MODULE_CONFIG',
    (): JwtConfigInterface => ({
        secret: process.env.JWT_SECRET || 'secret',
        access: {
            signOptions: {
                expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '1h') as StringValue,
            },
        },
        refresh: {
            signOptions: {
                expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue,
            }
        }
    })
);