import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp } from '../common/entities';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto';
import { BaseRepository, InjectBaseRepository } from '../common/repository/base.repository';
import { CustomerService } from '../customer/customer.service';

@Injectable()
export class FollowUpService {

  constructor(
    private readonly customerService: CustomerService,
  ) {}

  @InjectBaseRepository(FollowUp)
  private readonly followUpRepository: BaseRepository<FollowUp>;

  async create(createFollowUpDto: CreateFollowUpDto): Promise<FollowUp> {

    await this.customerService.update(createFollowUpDto.customerId, { lastFollowTime: new Date() });

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
    return this.followUpRepository.findAllPage(query, { relations: ['customer'] });
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

  async update(id: number, updateFollowUpDto: UpdateFollowUpDto) {
    return this.followUpRepository.update(id, updateFollowUpDto);
  }

  async remove(id: number): Promise<FollowUp> {
    return this.followUpRepository.remove(id);
  }
} 