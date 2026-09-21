import { HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';

export function IsUUIDParam(param: string) : ParameterDecorator {
    return Param(param, new ParseUUIDPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () => {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message: `O parâmetro ${param} deve ser um UUID válido`,
                error: 'Bad Request'
            }
        },
    }));
}