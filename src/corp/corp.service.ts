import { Injectable, NotFoundException } from '@nestjs/common';
import { Corp } from '../common/entities';
import { BaseRepository } from '../common/repository/base.repository';
import { InjectBaseRepository } from '../common/repository/base.repository';

@Injectable()
export class CorpService {
  constructor(
    @InjectBaseRepository(Corp)
    private readonly corpRepository: BaseRepository<Corp>,
  ) {}

  async create(corp: Partial<Corp>): Promise<Corp> {
    return this.corpRepository.create(corp);
  }

  async findAll(): Promise<Corp[]> {
    return this.corpRepository.findAll();
  }

  async findOne(id: number): Promise<Corp> {
    const corp = await this.corpRepository.findOne(id);
    if (!corp) {
      throw new NotFoundException(`企业微信授权 #${id} 不存在`);
    }
    return corp;
  }

  async update(id: number, corp: Partial<Corp>): Promise<Corp> {
    await this.corpRepository.update(id, corp);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.corpRepository.remove(id);
  }

  async findByCorpId(corpid: string): Promise<Corp | null> {
    return (await this.corpRepository.getRepository()).findOne({
      where: { corpid },
    });
  }
} 