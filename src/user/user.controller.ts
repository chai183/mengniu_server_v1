import { Controller, Get, Query, Post, Body, Patch, Param, Delete, ParseIntPipe, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';


@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  // @UseGuards(JwtAuthGuard)
  create(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  //分页获取用户
  @Get('page')
  findAllPage(@Query() query: any) {
    return this.userService.findAllPage(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Post('batch')
  createBatch(@Body() createUserDtos: any[]) {
    return this.userService.createBatch([{
      "userid": "zhangsan111",
      "name": "李四111",
      "department": [1, 2],
      "order": [1, 2],
      "position": "后台工程师",
      "mobile": "13800000000",
      "gender": "1",
      "email": "zhangsan@gzdev.com",
      "biz_mail": "zhangsan@qyycs2.wecom.work",
      "is_leader_in_dept": [1, 0],
      "direct_leader": ["lisi"],
      "avatar": "http://wx.qlogo.cn/mmopen/ajNVdqHZLLA3WJ6DSZUfiakYe37PKnQhBIeOQBO4czqrnZDS79FH5Wm5m4X69TBicnHFlhiafvDwklOpZeXYQQ2icg/0",
      "thumb_avatar": "http://wx.qlogo.cn/mmopen/ajNVdqHZLLA3WJ6DSZUfiakYe37PKnQhBIeOQBO4czqrnZDS79FH5Wm5m4X69TBicnHFlhiafvDwklOpZeXYQQ2icg/100",
      "telephone": "020-123456",
      "alias": "jackzhang",
      "status": 1,
      "address": "广州市海珠区新港中路",
      "english_name": "jacky",
      "open_userid": "xxxxxx",
      "main_department": 1,
      "qr_code": "https://open.work.weixin.qq.com/wwopen/userQRCode?vcode=xxx",
    }]);
  }

}

