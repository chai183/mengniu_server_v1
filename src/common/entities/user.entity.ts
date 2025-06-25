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
    if (user) {
      this.creater = user.userid;
      this.updater = user.userid;
    }
  }

  @BeforeUpdate()
  setUpdateInfo() {
    const user = RequestContextService.getCurrentUser();
    if (user) {
      this.updater = user.userid;
    }
  }
}

@Entity()
export class User extends BaseEntity {

  @Column({ nullable: true })
  account: string;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  userid: string;

  @Column({ nullable: true })
  name: string;

  @Column('simple-array', { nullable: true })
  department: number[];

  @Column('simple-array', { nullable: true })
  order: number[];

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  biz_mail: string;

  @Column('simple-array', { nullable: true })
  is_leader_in_dept: number[];

  @Column('simple-array', { nullable: true })
  direct_leader: string[];

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  thumb_avatar: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  alias: string;

  @Column({ default: 1 })
  status: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  english_name: string;

  @Column({ nullable: true })
  open_userid: string;

  @Column({ nullable: true })
  main_department: number;

  @Column({ nullable: true })
  qr_code: string;

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