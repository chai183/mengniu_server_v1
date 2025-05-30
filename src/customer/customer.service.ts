import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../common/entities';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { PageOptionsDto } from './dto/page-customer.dto';
import { BaseRepository, InjectBaseRepository } from '../common/repository/base.repository';
import { Like } from 'typeorm';

const externalcontactGet = async (userid: string) => {
  return {
    "errcode": 0,
    "errmsg": "ok",
    "external_contact": {
      "external_userid": "woAJ2GCAAAXtWyujaWJHDDGi0mACHAAA",
      "name": "李四",
      "position": "Manager",
      "avatar": "https://q3.itc.cn/q_70/images03/20240203/56dcf1cded2641c28170b8ec4f5f17dc.jpeg",
      "corp_name": "腾讯",
      "corp_full_name": "腾讯科技有限公司",
      "type": 2,
      "gender": 1,
      "unionid": "ozynqsulJFCZ2z1aYeS8h-nuasdAAA",
      "external_profile": {
        "external_attr":
          [
            {
              "type": 0,
              "name": "文本名称",
              "text":
              {
                "value": "文本"
              }
            },
            {
              "type": 1,
              "name": "网页名称",
              "web":
              {
                "url": "https://www.test.com",
                "title": "标题"
              }
            },
            {
              "type": 2,
              "name": "测试app",
              "miniprogram":
              {
                "appid": "wx8bd80126147df384",
                "pagepath": "/index",
                "title": "my miniprogram"
              }
            }
          ]
      }
    },
    "follow_user":
      [
        {
          "userid": "rocky",
          "remark": "李部长",
          "description": "对接采购事务",
          "createtime": 1525779812,
          "tags":
            [
              {
                "group_name": "标签分组名称",
                "tag_name": "标签名称",
                "tag_id": "etAJ2GCAAAXtWyujaWJHDDGi0mACHAAA",
                "type": 1
              },
              {
                "group_name": "标签分组名称",
                "tag_name": "标签名称",
                "type": 2
              },
              {
                "group_name": "标签分组名称",
                "tag_name": "标签名称",
                "tag_id": "stAJ2GCAAAXtWyujaWJHDDGi0mACHAAA",
                "type": 3
              }
            ],
          "remark_corp_name": "腾讯科技",
          "remark_mobiles":
            [
              "13800000001",
              "13000000002"
            ],
          "oper_userid": "rocky",
          "add_way": 10,
          "wechat_channels": {
            "nickname": "视频号名称",
            "source": 1
          }
        },
        {
          "userid": "tommy",
          "remark": "李总",
          "description": "采购问题咨询",
          "createtime": 1525881637,
          "state": "外联二维码1",
          "oper_userid": "woAJ2GCAAAXtWyujaWJHDDGi0mACHAAA",
          "add_way": 3
        }
      ],
    "next_cursor": "NEXT_CURSOR"
  }
}

@Injectable()
export class CustomerService {
  @InjectBaseRepository(Customer)
  private readonly customerRepository: BaseRepository<Customer>;

  async create(createCustomerDto: CreateCustomerDto) {
    return this.customerRepository.create(createCustomerDto);
  }

  async createByUserid(userid: string) {
    const res = await externalcontactGet(userid);
    return this.customerRepository.create({
      userid,
      ...res.external_contact
    });
  }

  async findAll(query: PageOptionsDto) {
    const { name } = query;
    const customers = await this.customerRepository.findAll();
    return customers.filter(customer => 
      !customer.isDeleted && 
      (!name || customer.name.includes(name))
    );
  }

  async findAllPage(query: any) {
    return this.customerRepository.findAllPage(query);
  }

  async findOne(id: number) {
    return this.customerRepository.findOne(id);
  }

  async findOneByUserid(userid: string) {
    const customer = await this.customerRepository.findOneByUserid(userid);
    if (!customer) {
      return this.createByUserid(userid);
    }
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return this.customerRepository.update(id, updateCustomerDto);
  }

  async remove(id: number) {
    const customer = await this.customerRepository.findOne(id);
    if (!customer) {
      throw new BusinessException(1001, '客户不存在');
    }
    return this.customerRepository.update(id, { isDeleted: true });
  }
} 