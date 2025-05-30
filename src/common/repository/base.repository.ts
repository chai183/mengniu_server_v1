import { Repository, FindOptionsWhere, Between, Like, ObjectLiteral, DeepPartial, UpdateResult, DeleteResult } from 'typeorm';
import { BusinessException } from '../exceptions/business.exception';
import { Inject } from '@nestjs/common';

export class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<T | null> {
    return this.repository.findOne({ where: { id } as unknown as FindOptionsWhere<T> });
  }

  async update(id: number, data: DeepPartial<T>): Promise<UpdateResult> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new BusinessException(1001, '记录不存在');
    }
    return this.repository.update(id, data as any);
  }

  async remove(id: number): Promise<DeleteResult> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new BusinessException(1001, '记录不存在');
    }
    return this.repository.delete(id);
  }

  async findAllPage(query: any) {
    const { page, limit, 'createTime[]': createTime, 'updateTime[]': updateTime, ...rest } = query;
    
    const where: any = { ...rest };
    
    // 处理时间范围查询
    if (createTime) {
      where.createTime = Between(createTime[0], createTime[1]);
    }
    if (updateTime) {
      where.updateTime = Between(updateTime[0], updateTime[1]);
    }

    // 处理模糊查询
    Object.keys(where).forEach(key => {
      if (typeof where[key] === 'string' && where[key]) {
        where[key] = Like(`%${where[key]}%`);
      }
    });

    const [data, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where
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

export function InjectBaseRepository<T extends ObjectLiteral>(entity: new () => T) {
  return Inject(entity.name);
}

