import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseInterceptors, ClassSerializerInterceptor, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PageOptionsDto } from './dto/page-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('customer')
// @UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  findAll(@Query() query: PageOptionsDto) {
    return this.customerService.findAll(query);
  }


  @Get('page')
  findAllPage(@Query() query: PageOptionsDto) {
    return this.customerService.findAllPage(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @Get('userid/:userid')
  findOneByUserid(@Param('userid') userid: string) {
    return this.customerService.findOneByUserid(userid);  
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.remove(id);
  }
} 