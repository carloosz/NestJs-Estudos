import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const DefaultUser = {
    username: 'testuser',
    password: 'testpassword',
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@localhost',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /user', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send(DefaultUser)
      .expect(201);
  });

  it('GET /user', () => {
    return request(app.getHttpServer()).get('/user').expect(200).expect([]);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
