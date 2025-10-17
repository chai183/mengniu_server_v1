import { Repository, FindOptionsWhere, Between, Like, ObjectLiteral, DeepPartial, UpdateResult, DeleteResult, FindOptionsOrder, In } from 'typeorm';
import { BusinessException } from '../exceptions/business.exception';
import { Inject } from '@nestjs/common';

interface BaseEntity extends ObjectLiteral {
  isDeleted: boolean;
}

export class BaseRepository<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) { }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(query: any = {}): Promise<T[]> {
    const { name } = query;
    const where: any = { isDeleted: false };
    if (name) {
      where.name = Like(`%${name}%`);
    }
    return this.repository.find({ where });
  }

  async findOne(id: number): Promise<T | null> {
    return this.repository.findOne({ where: { id } as unknown as FindOptionsWhere<T> });
  }

  async update(id: number, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new BusinessException(1001, '记录不存在');
    }
    
    // 使用Object.assign更新实体，TypeORM会自动过滤不存在的字段
    Object.assign(entity, data);
    
    return this.repository.save(entity);
  }

  async remove(id: number): Promise<T> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new BusinessException(1001, '记录不存在');
    }
    entity.isDeleted = true;
    return this.repository.save(entity);
  }

  async findAllPage(query: any, { relations }: { relations?: string[] } = {}) {
    const { page, limit, createTime, updateTime, ...rest } = query;

    const where: any = { isDeleted: false, ...rest };

    // 处理时间范围查询
    if (createTime) {
      if (Array.isArray(createTime)) {
        where.createTime = Between(createTime[0], createTime[1]);
      } else {
        if (createTime.includes(',')) {
          where.createTime = Between(...(createTime.split(',') as [string, string]));
        } else {
          where.createTime = createTime;
        }
      }
    }
    if (updateTime) {
      if (Array.isArray(updateTime)) {
        where.updateTime = Between(updateTime[0], updateTime[1]);
      } else {
        if (updateTime.includes(',')) {
          where.updateTime = Between(...(updateTime.split(',') as [string, string]));
        } else {
          where.updateTime = updateTime;
        }
      }
    }

    // 处理数组参数
    Object.keys(where).forEach(key => {
      if (Array.isArray(where[key])) {
        // 如果是数组，使用 In 操作符
        where[key] = In(where[key]);
      } else if (typeof where[key] === 'string' && where[key]) {
        // 处理模糊查询
        if (key === 'customerId' || key === 'creater') {
          // 客户id,不用模糊查询
          where[key] = where[key];
        } else {
          where[key] = Like(`%${where[key]}%`);
        }

      }
    });

    const [data, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where,
      order: {
        createTime: 'DESC'
      } as unknown as FindOptionsOrder<T>,
      relations: relations
    });

    return {
      data,
      total
    };
  }

  async findOneByUserid(userid: string) {
    return this.repository.findOne({ where: { userid } as unknown as FindOptionsWhere<T> });
  }

  async getRepository(): Promise<Repository<T>> {
    return this.repository;
  }
}

export function InjectBaseRepository<T extends BaseEntity>(entity: new () => T) {
  return Inject(entity.name);
}