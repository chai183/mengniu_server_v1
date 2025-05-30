import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { RequestContextService } from '../utils/request-context.service';

@Entity()
export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  @Exclude()
  isDeleted: boolean;

  @Column({
    default: () => 'CURRENT_TIMESTAMP'
  })
  @CreateDateColumn()
  createTime: Date;

  //创建人
  @Column()
  creater: string;

  @Column({
    default: () => 'CURRENT_TIMESTAMP'
  })
  @UpdateDateColumn()
  updateTime: Date;

  //更新人
  @Column()
  updater: string;

  @BeforeInsert()
  setCreateInfo() {
    const user = RequestContextService.getCurrentUser();
    console.log(user);
    if (user) {
      this.creater = user.userid;
      this.updater = user.userid;
    }
  }

  @BeforeUpdate()
  setUpdateInfo() {
    const user = RequestContextService.getCurrentUser();
    console.log(user);
    if (user) {
      this.updater = user.userid;
    }
  }
}

@Entity()
export class User extends BaseEntity {

  @Column()
  account: string;

  @Exclude()
  @Column()
  password: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // 如果密码已被修改，则进行加密
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // 验证密码的方法
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
} 