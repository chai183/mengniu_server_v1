import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowUp } from './entities/follow-up.entity';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto';
import { BaseRepository, InjectBaseRepository } from '../common/repository/base.repository';

@Injectable()
export class FollowUpService {
  @InjectBaseRepository(FollowUp)
  private readonly followUpRepository: BaseRepository<FollowUp>;

  async create(createFollowUpDto: CreateFollowUpDto): Promise<FollowUp> {
    return this.followUpRepository.create(createFollowUpDto);
  }

  async findAll(): Promise<FollowUp[]> {
    const repository = await this.followUpRepository.getRepository();
    return repository.find({
      where: { isDeleted: false },
      relations: ['customer'],
    });
  }

  async findAllPage(query: any) {
    return this.followUpRepository.findAllPage(query);
  }

  async findByCustomerId(customerId: number, type: number): Promise<FollowUp[]> {
    const repository = await this.followUpRepository.getRepository();
    return repository.find({
      where: {
        customerId,
        type,
        isDeleted: false,
      },
      order: {
        createTime: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<FollowUp> {
    const repository = await this.followUpRepository.getRepository();
    const followUp = await repository.findOne({
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
    const repository = await this.followUpRepository.getRepository();
    const followUp = await this.findOne(id);
    
    // 更新实体
    repository.merge(followUp, updateFollowUpDto);
    
    return repository.save(followUp);
  }

  async remove(id: number): Promise<void> {
    const repository = await this.followUpRepository.getRepository();
    const followUp = await this.findOne(id);
    
    // 软删除
    followUp.isDeleted = true;
    await repository.save(followUp);
  }
} 