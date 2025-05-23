import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.id, {
    eager: true,
    onDelete: 'CASCADE',
  })
  post: PostEntity;

  @CreateDateColumn()
  createdAt: Date;
}
