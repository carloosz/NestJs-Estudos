import * as bcrypt from 'bcrypt';

export abstract class CryptUtil {
  static async generateSalt(): Promise<string> {
    return await bcrypt.genSalt();
  }

  static async hashPassword(password: string, salt: string): Promise<string> {
    return await bcrypt.hash(password, salt);
  }

  static async validatePassword(
    password: string,
    hashedPassword: string,
    salt: string,
  ): Promise<boolean> {
    const hash = await this.hashPassword(password, salt);
    return hash === hashedPassword;
  }
}