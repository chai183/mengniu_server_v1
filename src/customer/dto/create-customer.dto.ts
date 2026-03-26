import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  // @IsPhoneNumber()
  phone: string;

  @IsString()
  @IsOptional()
  shop: string;

  @IsString()
  @IsOptional()
  detail: string;

  @IsString()
  @IsOptional()
  remark: string;

  @IsString()
  @IsOptional()
  images: string;

  lastFollowTime: Date;

}