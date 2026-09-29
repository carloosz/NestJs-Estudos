import 'dotenv/config';
import { DataSource } from 'typeorm';
import { UserSubscriber } from './modules/user/users.subscriber';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  subscribers: [ UserSubscriber ],
  logging: true,
});
