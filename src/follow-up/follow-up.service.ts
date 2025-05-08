import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp } from './entities/follow-up.entity';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto';

@Injectable()
export class FollowUpService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
  ) {}

  async create(createFollowUpDto: CreateFollowUpDto): Promise<FollowUp> {
    const followUp = this.followUpRepository.create(createFollowUpDto);
    return this.followUpRepository.save(followUp);
  }

  async findAll(): Promise<FollowUp[]> {
    return this.followUpRepository.find({
      where: { isDeleted: false },
      relations: ['customer'],
    });
  }

  async findByCustomerId(customerId: number): Promise<FollowUp[]> {
    return this.followUpRepository.find({
      where: {
        customerId,
        isDeleted: false,
      },
      order: {
        createTime: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<FollowUp> {
    const followUp = await this.followUpRepository.findOne({
      where: { 
        id, 
        isDeleted: false 
      },
      relations: ['customer'],
    });

    if (!followUp) {
      throw new NotFoundException(`跟进记录 #${id} 不存在`);
    }

    return followUp;
  }

  async update(id: number, updateFollowUpDto: UpdateFollowUpDto): Promise<FollowUp> {
    const followUp = await this.findOne(id);
    
    // 更新实体
    this.followUpRepository.merge(followUp, updateFollowUpDto);
    
    return this.followUpRepository.save(followUp);
  }

  async remove(id: number): Promise<void> {
    const followUp = await this.findOne(id);
    
    // 软删除
    followUp.isDeleted = true;
    await this.followUpRepository.save(followUp);
  }
} 