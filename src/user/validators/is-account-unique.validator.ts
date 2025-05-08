import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions, useContainer } from 'class-validator';
import { UserService } from '../user.service';

@ValidatorConstraint({ name: 'isAccountUnique', async: true })
@Injectable()
export class IsAccountUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) {}

  async validate(account: string, args: ValidationArguments) {
    try {
      const user = await this.userService.findByAccount(account);
      return !user;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return '账号已存在';
  }
}

export function IsAccountUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAccountUnique',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsAccountUniqueConstraint,
      async: true
    });
  };
} 