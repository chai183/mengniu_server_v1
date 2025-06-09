
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Good } from '../common/entities';
import { CreateGoodDto } from './dto/create-good.dto';
import { UpdateGoodDto } from './dto/update-good.dto';
import { PageOptionsDto } from './dto/page-good.dto';
import { BaseRepository, InjectBaseRepository } from '../common/repository/base.repository';


@Injectable()
export class GoodService {
  @InjectBaseRepository(Good)
  private readonly goodRepository: BaseRepository<Good>;

  async create(createGoodDto: CreateGoodDto) {
    return this.goodRepository.create(createGoodDto);
  }

  async findAll(query: PageOptionsDto) {
    return this.goodRepository.findAll(query);
  }

  async findAllPage(query: any) {
    return this.goodRepository.findAllPage(query);
  }

  async findOne(id: number) {
    return this.goodRepository.findOne(id);
  }

  async update(id: number, updateGoodDto: UpdateGoodDto) {
    return this.goodRepository.update(id, updateGoodDto);
  }

  async remove(id: number) {
    return this.goodRepository.remove(id);
  }
} 
