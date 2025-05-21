import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  mimetype: string;

  @Column({ length: 255 })
  url: string;

  @Column({ default: 'public' })
  visibility: 'public' | 'private';

  @ManyToOne(() => UserEntity, (user) => user.files, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  user?: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.files, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  post?: PostEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date | null;
}
