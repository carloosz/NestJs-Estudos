import { PickType } from "@nestjs/swagger";
import { UserDto } from "src/modules/user/dto/user.dto";

export class AuthEmailDto extends PickType(UserDto, ['email']) {}
